import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const RECURRING_FREQUENCIES = new Set(["daily", "weekly", "monthly", "yearly"]);

function normalizeWeeklyDays(value, fallbackDateInput) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((left, right) => left - right);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeWeeklyDays(parsed, fallbackDateInput);
      }

      if (typeof parsed === "string") {
        return normalizeWeeklyDays(parsed, fallbackDateInput);
      }
    } catch {
      const splitDays = value
        .split(",")
        .map((day) => Number(day.trim()))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

      if (splitDays.length) {
        return [...new Set(splitDays)].sort((left, right) => left - right);
      }
    }
  }

  if (fallbackDateInput) {
    return [new Date(fallbackDateInput).getUTCDay()];
  }

  return [];
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

function addRecurringInterval(dateInput, frequency) {
  const date = new Date(dateInput);
  if (frequency === "daily") {
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
    return date;
  }

  if (frequency === "monthly") {
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date;
  }

  if (frequency === "yearly") {
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    return date;
  }

  return date;
}

function addWeeklyRecurringInterval(dateInput, weeklyDays) {
  const date = new Date(dateInput);
  const selectedDays = normalizeWeeklyDays(weeklyDays, dateInput);
  if (!selectedDays.length) {
    date.setUTCDate(date.getUTCDate() + 7);
    return date;
  }

  const currentDay = date.getUTCDay();
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidateDay = (currentDay + offset) % 7;
    if (selectedDays.includes(candidateDay)) {
      date.setUTCDate(date.getUTCDate() + offset);
      return date;
    }
  }

  date.setUTCDate(date.getUTCDate() + 7);
  return date;
}

async function materializeRecurringExpenses(userId, upToDate) {
  if (!userId) {
    return;
  }

  const targetDate = upToDate ? new Date(upToDate) : new Date();
  const generationCutoff = Number.isNaN(targetDate.getTime())
    ? toEndOfDay(new Date())
    : toEndOfDay(targetDate);
  const templates = await prisma.expense.findMany({
    where: {
      userId,
      isRecurringTemplate: true,
      recurrenceFrequency: { in: Array.from(RECURRING_FREQUENCIES) },
      recurrenceEndDate: { not: null },
    },
    orderBy: { id: "asc" },
  });

  for (const template of templates) {
    if (!template.recurrenceFrequency || !template.recurrenceEndDate) {
      continue;
    }

    const recurrenceEnd = toEndOfDay(template.recurrenceEndDate);
    const weeklyDays = normalizeWeeklyDays(template.recurrenceWeeklyDays, template.createdAt);
    const baseCreatedAt = toStartOfDay(template.createdAt);
    let nextDate = template.nextRecurrenceDate
      ? toStartOfDay(template.nextRecurrenceDate)
      : template.recurrenceFrequency === "weekly"
        ? toStartOfDay(addWeeklyRecurringInterval(baseCreatedAt, weeklyDays))
        : toStartOfDay(addRecurringInterval(baseCreatedAt, template.recurrenceFrequency));
    let generatedAny = false;

    while (nextDate <= generationCutoff && nextDate <= recurrenceEnd) {
      try {
        await prisma.expense.create({
          data: {
            title: template.title,
            amount: template.amount,
            category: template.category,
            createdAt: nextDate,
            recurringParentId: template.id,
            userId,
          },
        });
        generatedAny = true;
      } catch (error) {
        // Keep recurrence processing resilient even if one occurrence fails.
        console.error("Recurring expense generation error:", error?.message || error);
      }

      nextDate = template.recurrenceFrequency === "weekly"
        ? addWeeklyRecurringInterval(nextDate, weeklyDays)
        : addRecurringInterval(nextDate, template.recurrenceFrequency);
    }

    const hasNext = nextDate <= recurrenceEnd;
    const nextRecurrenceDate = hasNext ? toStartOfDay(nextDate) : null;
    const currentNext = template.nextRecurrenceDate ? toStartOfDay(template.nextRecurrenceDate) : null;
    const nextChanged =
      (currentNext && nextRecurrenceDate && currentNext.getTime() !== nextRecurrenceDate.getTime())
      || (!currentNext && nextRecurrenceDate)
      || (currentNext && !nextRecurrenceDate);

    if (generatedAny || nextChanged) {
      await prisma.expense.update({
        where: { id: template.id },
        data: { nextRecurrenceDate },
      });
    }
  }
}

// export const getDailyExpenses = async (req, res) => {
//   const expenses = await prisma.expense.groupBy({
//     by: ['createdAt'],
//     _sum: { amount: true },
//   });

//   // Convert createdAt to just date string (YYYY-MM-DD)
//   const formatted = expenses.map(e => ({
//     date: e.createdAt.toISOString().split('T')[0],
//     total: e._sum.amount
//   }));

//   res.json(formatted);
// };

export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, groupBy, generateUpTo } = req.query;

    const generationUpTo = generateUpTo || to || from || null;
    await materializeRecurringExpenses(userId, generationUpTo);

    // Build a safe createdAt filter only when from/to are valid dates
    const filter = { userId };
    if (from || to) {
      const createdAtFilter = {};
      if (from) {
        const f = toStartOfDay(from);
        if (!Number.isNaN(f.getTime())) createdAtFilter.gte = f;
      }
      if (to) {
        const t = toEndOfDay(to);
        if (!Number.isNaN(t.getTime())) createdAtFilter.lte = t;
      }
      if (Object.keys(createdAtFilter).length) filter.createdAt = createdAtFilter;
    }

    const expenses = await prisma.expense.findMany({
      where: filter,
      orderBy: { createdAt: "asc" },
    });

    // Helper: ISO date key YYYY-MM-DD
    const toDayKey = (d) => {
      const dt = new Date(d);
      return dt.toISOString().split('T')[0];
    };

    // Helper: year-week (ISO week-ish; simple approximation)
    const getWeekKey = (d) => {
      const date = new Date(d);
      const year = date.getFullYear();
      // Calculate week number (approximation by day-of-year / 7)
      const oneJan = new Date(year, 0, 1);
      const days = Math.floor((date - oneJan) / 86400000) + 1;
      const week = Math.ceil(days / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    };

    if (groupBy === 'daily') {
      const grouped = {};
      for (const e of expenses) {
        const key = toDayKey(e.createdAt);
        grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([date, total]) => ({ date, total })));
    }

    if (groupBy === 'weekly') {
      const grouped = {};
      for (const e of expenses) {
        const key = getWeekKey(e.createdAt);
        grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([week, total]) => ({ week, total })));
    }

    if (groupBy === 'monthly') {
      const grouped = {};
      for (const e of expenses) {
        const d = new Date(e.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
      }
      return res.json(Object.entries(grouped).map(([month, total]) => ({ month, total })));
    }

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching expenses" });
  }
};

export const addExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, category, date, recurrenceFrequency, recurrenceEndDate, recurrenceWeeklyDays, recurrenceDuration, recurrenceCount, recurrenceMonthlyPattern, recurrenceYearlyPattern } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ message: "Title, amount, and category are required" });
    }

    // Normalize amount
    const amt = Number(amount);
    if (Number.isNaN(amt)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Normalize/validate date
    let dateValue = new Date();
    if (date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        // try parsing common dd-mm-yyyy formats by swapping
        const parts = String(date).split(/[-/\.]/).map(p => p.trim());
        if (parts.length === 3) {
          // if looks like dd-mm-yyyy, convert to yyyy-mm-dd
          const [a, b, c] = parts;
          // detect if first part is day (>=1 and <=31)
          if (Number(a) > 0 && Number(a) <= 31) {
            const iso = `${c.padStart(4,'0')}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
            const tryIso = new Date(iso);
            if (!Number.isNaN(tryIso.getTime())) {
              dateValue = tryIso;
            } else {
              // fallback to server now
              dateValue = new Date();
            }
          } else {
            dateValue = new Date();
          }
        } else {
          dateValue = new Date();
        }
      } else {
        dateValue = parsed;
      }
    }

    const normalizedFrequency = String(recurrenceFrequency || "").trim().toLowerCase();
    const hasRecurrence = Boolean(normalizedFrequency);
    const weeklyDays = normalizeWeeklyDays(recurrenceWeeklyDays, dateValue);

    if (hasRecurrence && !RECURRING_FREQUENCIES.has(normalizedFrequency)) {
      return res.status(400).json({ message: "Invalid recurrence frequency" });
    }

    if (hasRecurrence && !recurrenceEndDate) {
      return res.status(400).json({ message: "Recurrence end date is required" });
    }

    let recurrenceEnd = null;
    let nextRecurrenceDate = null;
    if (hasRecurrence) {
      recurrenceEnd = new Date(recurrenceEndDate);
      if (Number.isNaN(recurrenceEnd.getTime())) {
        return res.status(400).json({ message: "Invalid recurrence end date" });
      }

      const createdDay = toStartOfDay(dateValue);
      recurrenceEnd = toEndOfDay(recurrenceEnd);
      if (recurrenceEnd < createdDay) {
        return res.status(400).json({ message: "Recurrence end date must be on or after expense date" });
      }

      const firstNextDate = toStartOfDay(addRecurringInterval(createdDay, normalizedFrequency));
      const weeklyFirstNextDate = normalizedFrequency === "weekly"
        ? toStartOfDay(addWeeklyRecurringInterval(createdDay, weeklyDays))
        : firstNextDate;
      const firstNext = normalizedFrequency === "weekly" ? weeklyFirstNextDate : firstNextDate;
      nextRecurrenceDate = firstNext <= recurrenceEnd ? firstNext : null;
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: amt,
        category,
        createdAt: dateValue,
        userId,
        recurrenceFrequency: hasRecurrence ? normalizedFrequency : null,
        recurrenceEndDate: hasRecurrence ? recurrenceEnd : null,
        nextRecurrenceDate: hasRecurrence ? nextRecurrenceDate : null,
        isRecurringTemplate: hasRecurrence,
        recurrenceWeeklyDays: hasRecurrence && normalizedFrequency === "weekly" ? JSON.stringify(weeklyDays) : null,
        recurrenceDuration: hasRecurrence ? String(recurrenceDuration || "until") : null,
        recurrenceCount: hasRecurrence ? String(recurrenceCount || "") : null,
        recurrenceMonthlyPattern: hasRecurrence && normalizedFrequency === "monthly" ? String(recurrenceMonthlyPattern || "date") : null,
        recurrenceYearlyPattern: hasRecurrence && normalizedFrequency === "yearly" ? String(recurrenceYearlyPattern || "date") : null,
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    const errMsg = error && error.stack ? error.stack : String(error);
    console.error('addExpense error:', errMsg);
    res.status(500).json({ message: "Server error", error: error && error.message ? error.message : null });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const expenseId = Number(id);

    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const expenseId = Number(id);
    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { title, amount, category, date, recurrenceFrequency, recurrenceEndDate, recurrenceWeeklyDays, recurrenceDuration, recurrenceCount, recurrenceMonthlyPattern, recurrenceYearlyPattern } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (amount !== undefined) {
      const amt = Number(amount);
      if (Number.isNaN(amt)) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      updateData.amount = amt;
    }
    if (category) updateData.category = category;
    if (date) {
      let dateValue = new Date(date);
      if (Number.isNaN(dateValue.getTime())) {
        // try parsing dd-mm-yyyy
        const parts = String(date).split(/[-/\.]/).map(p => p.trim());
        if (parts.length === 3) {
          const [a, b, c] = parts;
          if (Number(a) > 0 && Number(a) <= 31) {
            const iso = `${c.padStart(4,'0')}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
            const tryIso = new Date(iso);
            if (!Number.isNaN(tryIso.getTime())) {
              dateValue = tryIso;
            } else {
              dateValue = new Date();
            }
          } else {
            dateValue = new Date();
          }
        } else {
          dateValue = new Date();
        }
      }
      updateData.createdAt = dateValue;
    }

    if (recurrenceFrequency !== undefined || recurrenceEndDate !== undefined) {
      const normalizedFrequency = String(recurrenceFrequency || existing.recurrenceFrequency || "")
        .trim()
        .toLowerCase();

      if (!normalizedFrequency) {
        updateData.recurrenceFrequency = null;
        updateData.recurrenceEndDate = null;
        updateData.nextRecurrenceDate = null;
        updateData.isRecurringTemplate = false;
        updateData.recurrenceWeeklyDays = null;
        updateData.recurrenceDuration = null;
        updateData.recurrenceCount = null;
        updateData.recurrenceMonthlyPattern = null;
        updateData.recurrenceYearlyPattern = null;
      } else {
        if (!RECURRING_FREQUENCIES.has(normalizedFrequency)) {
          return res.status(400).json({ message: 'Invalid recurrence frequency' });
        }

        const weeklyDays = normalizeWeeklyDays(recurrenceWeeklyDays || existing.recurrenceWeeklyDays, updateData.createdAt || existing.createdAt);
        const recurrenceEndRaw = recurrenceEndDate || existing.recurrenceEndDate;
        if (!recurrenceEndRaw) {
          return res.status(400).json({ message: 'Recurrence end date is required' });
        }

        const recurrenceEnd = new Date(recurrenceEndRaw);
        if (Number.isNaN(recurrenceEnd.getTime())) {
          return res.status(400).json({ message: 'Invalid recurrence end date' });
        }

        const baseDate = toStartOfDay(updateData.createdAt || existing.createdAt);
        const normalizedRecurrenceEnd = toEndOfDay(recurrenceEnd);
        if (normalizedRecurrenceEnd < baseDate) {
          return res.status(400).json({ message: 'Recurrence end date must be on or after expense date' });
        }

        const nextDate = normalizedFrequency === "weekly"
          ? toStartOfDay(addWeeklyRecurringInterval(baseDate, weeklyDays))
          : toStartOfDay(addRecurringInterval(baseDate, normalizedFrequency));

        updateData.recurrenceFrequency = normalizedFrequency;
        updateData.recurrenceEndDate = normalizedRecurrenceEnd;
        updateData.nextRecurrenceDate = nextDate <= normalizedRecurrenceEnd ? nextDate : null;
        updateData.isRecurringTemplate = true;
        updateData.recurrenceWeeklyDays = normalizedFrequency === "weekly" ? JSON.stringify(weeklyDays) : null;
        updateData.recurrenceDuration = String(recurrenceDuration || existing.recurrenceDuration || "until");
        updateData.recurrenceCount = recurrenceCount !== undefined ? String(recurrenceCount) : (existing.recurrenceCount || null);
        updateData.recurrenceMonthlyPattern = normalizedFrequency === "monthly"
          ? String(recurrenceMonthlyPattern || existing.recurrenceMonthlyPattern || "date")
          : null;
        updateData.recurrenceYearlyPattern = normalizedFrequency === "yearly"
          ? String(recurrenceYearlyPattern || existing.recurrenceYearlyPattern || "date")
          : null;
      }
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData
    });
    
    // Learn from user's manual category assignment if category was changed
    if (updateData.category && updateData.title) {
      try {
        await fetch('http://127.0.0.1:5001/api/learn-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updateData.title,
            category: updateData.category,
            user_id: String(userId)
          })
        });
      } catch (err) {
        console.log('ML service learning skipped:', err.message);
      }
    }
    
    res.json(updated);
  } catch (error) {
    console.error('updateExpense error:', error && error.stack ? error.stack : error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

