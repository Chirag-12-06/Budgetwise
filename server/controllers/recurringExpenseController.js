import { PrismaClient } from "@prisma/client";
import { logError, logInfo } from "../utils/logger.js";
import { materializeDueRecurringExpensesForUser } from "./expenseController.js";

const prisma = new PrismaClient();

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
    const parsedEndDate = endType === "until_date" ? parseFlexibleDate(endDate) : null;

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

    await prisma.recurringExpense.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    return res.json({ success: true });
  } catch (error) {
    logRecurringExpenseError("delete", error);
    return res.status(500).json(buildErrorResponse(error, "Error deleting recurring expense"));
  }
};
