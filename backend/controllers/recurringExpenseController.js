import prisma from "../lib/prisma.js";
import { logError, logInfo } from "../utils/logger.js";
import { materializeDueRecurringExpensesForUser } from "./expenseController.js";

const RECURRENCE_FREQUENCY_MAP = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

const RECURRENCE_END_TYPE_MAP = {
  forever: "FOREVER",
  count: "COUNT",
  until_date: "UNTIL_DATE",
};

function normalizeRecurrenceFrequency(value) {
  const key = String(value || "").trim().toLowerCase();
  return RECURRENCE_FREQUENCY_MAP[key] || null;
}

function normalizeRecurrenceEndType(value) {
  const key = String(value || "").trim().toLowerCase();
  return RECURRENCE_END_TYPE_MAP[key] || null;
}

function serializeRecurringExpense(recurringExpense) {
  return {
    ...recurringExpense,
    frequency: String(recurringExpense.frequency || "").toUpperCase(),
    endType: String(recurringExpense.endType || "").toUpperCase(),
  };
}

function logRecurringExpenseError(operation, error) {
  logError(`[recurring-expenses] ${operation} failed`, error?.stack || error?.message || error);
}

function buildErrorResponse(error, fallbackMessage) {
  const response = { error: fallbackMessage };

  if (process.env.NODE_ENV !== "production") {
    response.details = error?.message || String(error);
  }

  return response;
}

function parseFlexibleDate(value) {
  if (!value) {
    return new Date();
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const parts = String(value).split(/[-/\.]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (Number(a) > 0 && Number(a) <= 31) {
      const iso = `${c.padStart(4, "0")}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
      const parsedIso = new Date(iso);
      if (!Number.isNaN(parsedIso.getTime())) {
        return parsedIso;
      }
    }
  }

  return new Date();
}

export const addRecurringExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      amount,
      category,
      frequency,
      intervalValue,
      startDate,
      endType,
      endCount,
      endDate,
    } = req.body;

    const normalizedFrequency = normalizeRecurrenceFrequency(frequency);
    const normalizedEndType = normalizeRecurrenceEndType(endType);

    // Validation
    if (!title || !amount || !category || !normalizedFrequency || !normalizedEndType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const parsedStartDate = parseFlexibleDate(startDate);
    const parsedEndDate = normalizedEndType === "UNTIL_DATE" ? parseFlexibleDate(endDate) : null;

    if (normalizedEndType === "UNTIL_DATE" && !endDate) {
      return res.status(400).json({ error: "End date is required for until-date recurring expenses" });
    }

    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        title: title.trim(),
        userId,
        amount: Number(amount),
        category,
        frequency: normalizedFrequency,
        intervalValue: Number(intervalValue) || 1,
        startDate: parsedStartDate,
        endType: normalizedEndType,
        endCount: normalizedEndType === "COUNT" ? Number(endCount) : null,
        endDate: parsedEndDate,
        nextDueDate: parsedStartDate,
        isActive: true,
      },
    });
    // Immediately materialize if due date is today or past
    try {
      await materializeDueRecurringExpensesForUser(userId);
    } catch (error) {
      logError("❌ Failed to materialize after creating recurring expense:", error);
    }

    return res.status(201).json(serializeRecurringExpense(recurringExpense));
  } catch (error) {
    logRecurringExpenseError("create", error);
    return res.status(500).json(buildErrorResponse(error, "Error creating recurring expense"));
  }
};

export const getRecurringExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { startDate: "asc" },
    });

    return res.json(recurringExpenses.map(serializeRecurringExpense));
  } catch (error) {
    logRecurringExpenseError("fetch", error);
    return res.status(500).json(buildErrorResponse(error, "Error fetching recurring expenses"));
  }
};

export const getRecurringExpenseById = async (req, res) => {
  try {
    const userId = req.user.id;
    const recurringExpenseId = Number(req.params.id);

    if (Number.isNaN(recurringExpenseId)) {
      return res.status(400).json({ error: "Invalid recurring expense id" });
    }

    const recurringExpense = await prisma.recurringExpense.findFirst({
      where: {
        id: recurringExpenseId,
        userId,
      },
    });

    if (!recurringExpense) {
      return res.status(404).json({ error: "Recurring expense not found" });
    }

    return res.json(serializeRecurringExpense(recurringExpense));
  } catch (error) {
    logRecurringExpenseError("fetch-by-id", error);
    return res.status(500).json(buildErrorResponse(error, "Error fetching recurring expense"));
  }
};

export const updateRecurringExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const recurringExpenseId = Number(req.params.id);
    const {
      title,
      amount,
      category,
      frequency,
      intervalValue,
      startDate,
      endType,
      endCount,
      endDate,
    } = req.body;

    if (Number.isNaN(recurringExpenseId)) {
      return res.status(400).json({ error: "Invalid recurring expense id" });
    }

    const existingRecurringExpense = await prisma.recurringExpense.findFirst({
      where: {
        id: recurringExpenseId,
        userId,
      },
    });

    if (!existingRecurringExpense) {
      return res.status(404).json({ error: "Recurring expense not found" });
    }

    const normalizedFrequency = normalizeRecurrenceFrequency(frequency || existingRecurringExpense.frequency);
    const normalizedEndType = normalizeRecurrenceEndType(endType || existingRecurringExpense.endType);
    const nextTitle = String(title ?? existingRecurringExpense.title).trim();
    const nextAmount = Number(amount ?? existingRecurringExpense.amount);
    const nextCategory = String(category ?? existingRecurringExpense.category).trim();
    const nextIntervalValue = Number(intervalValue ?? existingRecurringExpense.intervalValue) || 1;
    const nextStartDate = parseFlexibleDate(startDate ?? existingRecurringExpense.startDate);
    const nextEndCount = normalizedEndType === "COUNT"
      ? Number(endCount ?? existingRecurringExpense.endCount)
      : null;
    const nextEndDate = normalizedEndType === "UNTIL_DATE"
      ? parseFlexibleDate(endDate ?? existingRecurringExpense.endDate)
      : null;

    if (!nextTitle || !nextCategory || !normalizedFrequency || !normalizedEndType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (normalizedEndType === "UNTIL_DATE" && !nextEndDate) {
      return res.status(400).json({ error: "End date is required for until-date recurring expenses" });
    }

    const scheduleChanged = normalizedFrequency !== existingRecurringExpense.frequency
      || Number(nextIntervalValue) !== Number(existingRecurringExpense.intervalValue)
      || nextStartDate.getTime() !== new Date(existingRecurringExpense.startDate).getTime()
      || normalizedEndType !== existingRecurringExpense.endType
      || String(nextEndCount ?? "") !== String(existingRecurringExpense.endCount ?? "")
      || String(nextEndDate ? nextEndDate.toISOString() : "") !== String(existingRecurringExpense.endDate ? new Date(existingRecurringExpense.endDate).toISOString() : "");

    if (!scheduleChanged) {
      const updatedRecurringExpense = await prisma.$transaction(async (tx) => {
        const recurring = await tx.recurringExpense.update({
          where: { id: existingRecurringExpense.id },
          data: {
            title: nextTitle,
            amount: nextAmount,
            category: nextCategory,
          },
        });

        await tx.expense.updateMany({
          where: {
            recurringId: existingRecurringExpense.id,
            userId,
          },
          data: {
            title: nextTitle,
            amount: nextAmount,
            category: nextCategory,
          },
        });

        return recurring;
      });

      return res.json(serializeRecurringExpense(updatedRecurringExpense));
    }

    const updatedRecurringExpense = await prisma.$transaction(async (tx) => {
      const nextRecurringExpense = await tx.recurringExpense.create({
        data: {
          title: nextTitle,
          userId,
          amount: nextAmount,
          category: nextCategory,
          frequency: normalizedFrequency,
          intervalValue: nextIntervalValue,
          startDate: nextStartDate,
          endType: normalizedEndType,
          endCount: nextEndCount,
          endDate: nextEndDate,
          nextDueDate: nextStartDate,
          isActive: true,
          occurrencesDone: 0,
        },
      });
      // Delete all existing expenses produced by the old recurring template
      await tx.expense.deleteMany({
        where: {
          recurringId: existingRecurringExpense.id,
          userId,
        },
      });

      // occurrencesDone starts at 0 for the new series; update to reflect actual rows (should be 0)
      const actualOccurrencesDone = await tx.expense.count({
        where: {
          recurringId: nextRecurringExpense.id,
          userId,
        },
      });

      const recurring = await tx.recurringExpense.update({
        where: { id: nextRecurringExpense.id },
        data: {
          occurrencesDone: actualOccurrencesDone,
        },
      });

      // Instead of deleting the old recurring template, mark it inactive
      // and set occurrencesDone to the number of remaining occurrences.
      const remainingOccurrences = await tx.expense.count({
        where: {
          recurringId: existingRecurringExpense.id,
          userId,
        },
      });

      if (remainingOccurrences === 0) {
        await tx.recurringExpense.delete({ where: { id: existingRecurringExpense.id } });
      } else {
        await tx.recurringExpense.update({
          where: { id: existingRecurringExpense.id },
          data: {
            isActive: false,
            occurrencesDone: remainingOccurrences,
          },
        });
      }

      return recurring;
    });

    try {
      await materializeDueRecurringExpensesForUser(userId);
    } catch (error) {
      logError("❌ Failed to materialize after updating recurring expense:", error);
    }

    return res.json(serializeRecurringExpense(updatedRecurringExpense));
  } catch (error) {
    logRecurringExpenseError("update", error);
    return res.status(500).json(buildErrorResponse(error, "Error updating recurring expense"));
  }
};

export const deleteRecurringExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const recurringExpense = await prisma.recurringExpense.findUnique({
      where: { id: Number(id) },
    });

    if (!recurringExpense) {
      return res.status(404).json({ error: "Recurring expense not found" });
    }

    if (recurringExpense.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.recurringExpense.delete({
      where: { id: Number(id) },
    });

    return res.json({ success: true });
  } catch (error) {
    logRecurringExpenseError("delete", error);
    return res.status(500).json(buildErrorResponse(error, "Error deleting recurring expense"));
  }
};
