import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getDailyExpenses = async (req, res) => {
  const expenses = await prisma.expense.groupBy({
    by: ['createdAt'],
    _sum: { amount: true },
  });

  // Convert createdAt to just date string (YYYY-MM-DD)
  const formatted = expenses.map(e => ({
    date: e.createdAt.toISOString().split('T')[0],
    total: e._sum.amount
  }));

  res.json(formatted);

export const getExpenses = async (req, res) => {
  try {
    const { from, to, groupBy } = req.query;
    // Base filter
    const filter = {};
    if (from && to) {
      filter.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: filter,
      orderBy: { date: "asc" },
    });

    // Optional grouping logic (can also be done client-side)
    if (groupBy === "daily") {
      // Already grouped by day (each expense entry has a date)
      return res.json(expenses);
    } else if (groupBy === "weekly") {
      // Group by week number
      const grouped = {};
      for (const e of expenses) {
        const week = Math.ceil(new Date(e.date).getDate() / 7);
        grouped[week] = (grouped[week] || 0) + e.amount;
      }
      return res.json(Object.entries(grouped).map(([week, total]) => ({ week, total })));
    } else if (groupBy === "monthly") {
      const grouped = {};
      for (const e of expenses) {
        const month = new Date(e.date).toLocaleString("default", { month: "short" });
        grouped[month] = (grouped[month] || 0) + e.amount;
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
    const { title, amount, category, date } = req.body;

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

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: amt,
        category,
        createdAt: dateValue
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
    const { id } = req.params;
    const expenseId = Number(id);

    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
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
    const { id } = req.params;
    const expenseId = Number(id);
    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const { title, amount, category, date } = req.body;
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

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    console.error('updateExpense error:', error && error.stack ? error.stack : error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

