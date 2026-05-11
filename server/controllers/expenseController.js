import { PrismaClient } from "@prisma/client";
import { logError } from "../utils/logger.js";

const prisma = new PrismaClient();
const activeMaterializationUserIds = new Set();

function cloneUtcDate(dateInput) {
  return new Date(new Date(dateInput).getTime());
}

function addRecurringInterval(dateInput, frequency, intervalValue) {
  const nextDate = cloneUtcDate(dateInput);
  const step = Math.max(1, Number(intervalValue) || 1);

  switch (frequency) {
    case "DAILY":
      nextDate.setUTCDate(nextDate.getUTCDate() + step);
      break;
    case "WEEKLY":
      nextDate.setUTCDate(nextDate.getUTCDate() + (7 * step));
      break;
    case "MONTHLY":
      nextDate.setUTCMonth(nextDate.getUTCMonth() + step);
      break;
    case "YEARLY":
      nextDate.setUTCFullYear(nextDate.getUTCFullYear() + step);
      break;
    default:
      nextDate.setUTCDate(nextDate.getUTCDate() + step);
      break;
  }

  return nextDate;
}

export async function materializeDueRecurringExpensesForUser(userId) {
  if (activeMaterializationUserIds.has(userId)) {
    return;
  }

  activeMaterializationUserIds.add(userId);
  const now = new Date();

  try {
    const dueRecurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
        nextDueDate: { lte: now },
      },
      orderBy: { nextDueDate: "asc" },
    });

    for (const recurringExpense of dueRecurringExpenses) {
      const nextDueDate = cloneUtcDate(recurringExpense.nextDueDate);
      const currentOccurrencesDone = Number(recurringExpense.occurrencesDone || 0);
      const nextOccurrenceDate = addRecurringInterval(
        nextDueDate,
        recurringExpense.frequency,
        recurringExpense.intervalValue,
      );
      const nextOccurrencesDone = currentOccurrencesDone + 1;
      const hasReachedCountLimit = recurringExpense.endType === "COUNT"
        && Number.isFinite(recurringExpense.endCount)
        && currentOccurrencesDone >= Number(recurringExpense.endCount);
      const willReachCountLimit = recurringExpense.endType === "COUNT"
        && Number.isFinite(recurringExpense.endCount)
        && nextOccurrencesDone >= Number(recurringExpense.endCount);
      const isUntilDateComplete = recurringExpense.endType === "UNTIL_DATE"
        && recurringExpense.endDate
        && nextOccurrenceDate > new Date(recurringExpense.endDate);

      await prisma.$transaction(async (tx) => {
        const existingExpense = await tx.expense.findFirst({
          where: {
            recurringId: recurringExpense.id,
            createdAt: nextDueDate,
            userId: recurringExpense.userId,
          },
        });

        if (!existingExpense && !hasReachedCountLimit) {
          try {
            await tx.expense.create({
              data: {
                title: recurringExpense.title,
                amount: recurringExpense.amount,
                category: recurringExpense.category,
                createdAt: nextDueDate,
                userId: recurringExpense.userId,
                recurringId: recurringExpense.id,
              },
            });
          } catch (err) {
            // If a unique constraint violation happened because another runner created it,
            // ignore and continue. Prisma uses code 'P2002' for unique constraint failures.
            if (err && err.code === 'P2002') {
              logError('Duplicate expense detected during creation (ignored)');
            } else {
              throw err;
            }
          }
        }

        await tx.recurringExpense.update({
          where: { id: recurringExpense.id },
          data: {
            occurrencesDone: nextOccurrencesDone,
            nextDueDate: nextOccurrenceDate,
            isActive: !(willReachCountLimit || isUntilDateComplete),
          },
        });
      });
    }
  } finally {
    activeMaterializationUserIds.delete(userId);
  }
}

export async function materializeDueRecurringExpensesForAllUsers() {
  const userIds = await prisma.recurringExpense.findMany({
    where: {
      isActive: true,
      nextDueDate: { lte: new Date() },
    },
    distinct: ["userId"],
    select: {
      userId: true,
    },
  });

  for (const { userId } of userIds) {
    await materializeDueRecurringExpensesForUser(userId);
  }
}

function parseIsoDateOnly(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function toStartOfDay(dateInput) {
  const dateOnly = parseIsoDateOnly(dateInput);
  if (dateOnly) {
    return new Date(Date.UTC(dateOnly.year, dateOnly.month - 1, dateOnly.day, 0, 0, 0, 0));
  }

  const date = new Date(dateInput);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function toEndOfDay(dateInput) {
  const dateOnly = parseIsoDateOnly(dateInput);
  if (dateOnly) {
    return new Date(Date.UTC(dateOnly.year, dateOnly.month - 1, dateOnly.day, 23, 59, 59, 999));
  }

  const date = new Date(dateInput);
  date.setUTCHours(23, 59, 59, 999);
  return date;
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

export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, groupBy } = req.query;

    await materializeDueRecurringExpensesForUser(userId);

    const filter = { userId };
    if (from || to) {
      const createdAtFilter = {};
      if (from) {
        const fromDate = toStartOfDay(from);
        if (!Number.isNaN(fromDate.getTime())) {
          createdAtFilter.gte = fromDate;
        }
      }
      if (to) {
        const toDate = toEndOfDay(to);
        if (!Number.isNaN(toDate.getTime())) {
          createdAtFilter.lte = toDate;
        }
      }
      if (Object.keys(createdAtFilter).length) {
        filter.createdAt = createdAtFilter;
      }
    }

    const expenses = await prisma.expense.findMany({
      where: filter,
      orderBy: { createdAt: "asc" },
    });

    const toDayKey = (dateInput) => {
      const date = new Date(dateInput);
      return date.toISOString().split("T")[0];
    };

    const getWeekKey = (dateInput) => {
      const date = new Date(dateInput);
      const year = date.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const days = Math.floor((date - oneJan) / 86400000) + 1;
      const week = Math.ceil(days / 7);
      return `${year}-W${String(week).padStart(2, "0")}`;
    };

    if (groupBy === "daily") {
      const grouped = {};
      for (const expense of expenses) {
        const key = toDayKey(expense.createdAt);
        grouped[key] = (grouped[key] || 0) + Number(expense.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([date, total]) => ({ date, total })));
    }

    if (groupBy === "weekly") {
      const grouped = {};
      for (const expense of expenses) {
        const key = getWeekKey(expense.createdAt);
        grouped[key] = (grouped[key] || 0) + Number(expense.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([week, total]) => ({ week, total })));
    }

    if (groupBy === "monthly") {
      const grouped = {};
      for (const expense of expenses) {
        const date = new Date(expense.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        grouped[key] = (grouped[key] || 0) + Number(expense.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([month, total]) => ({ month, total })));
    }

    return res.json(expenses);
  } catch (error) {
    logError(error);
    return res.status(500).json({ error: "Error fetching expenses" });
  }
};

export const addExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, category, date } = req.body;

    if (!title || amount === undefined || amount === null || !category) {
      return res.status(400).json({ message: "Title, amount, and category are required" });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const createdAt = parseFlexibleDate(date);

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parsedAmount,
        category,
        createdAt,
        userId,
      },
    });

    return res.status(201).json(expense);
  } catch (error) {
    const errMsg = error && error.stack ? error.stack : String(error);
    logError("addExpense error:", errMsg);
    return res.status(500).json({ message: "Server error", error: error?.message || null });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = Number(req.params.id);

    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({ where: { id: expenseId } });

      if (!existing.recurringId) {
        return;
      }

      const recurringExpense = await tx.recurringExpense.findFirst({
        where: {
          id: existing.recurringId,
          userId,
        },
      });

      if (!recurringExpense) {
        return;
      }

      const nextOccurrencesDone = Math.max(
        0,
        Number(recurringExpense.occurrencesDone || 0) - 1,
      );
      const updateData = {
        occurrencesDone: nextOccurrencesDone,
        nextDueDate: recurringExpense.nextDueDate,
      };

      if (recurringExpense.endType === "COUNT" && Number.isFinite(recurringExpense.endCount)) {
        updateData.isActive = nextOccurrencesDone < Number(recurringExpense.endCount);
      }

      await tx.recurringExpense.update({
        where: { id: recurringExpense.id },
        data: updateData,
      });
    });

    return res.json({ message: "Expense deleted" });
  } catch (error) {
    logError(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = Number(req.params.id);

    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const { title, amount, category, date } = req.body;
    const updateData = {};

    if (title) {
      updateData.title = title;
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (Number.isNaN(parsedAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      updateData.amount = parsedAmount;
    }

    if (category) {
      updateData.category = category;
    }

    if (date) {
      updateData.createdAt = parseFlexibleDate(date);
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });

    if (updateData.category && updateData.title) {
      try {
        await fetch("http://127.0.0.1:5001/api/learn-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updateData.title,
            category: updateData.category,
            user_id: String(userId),
          }),
        });
      } catch {
        // Keep update flow successful if ML service is unavailable.
      }
    }

    return res.json(updated);
  } catch (error) {
    logError("updateExpense error:", error && error.stack ? error.stack : error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Expense not found" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};
