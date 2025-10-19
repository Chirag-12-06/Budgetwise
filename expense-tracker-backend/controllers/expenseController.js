import { PrismaClient } from "@prisma/client";
import fs from 'fs';
const prisma = new PrismaClient();

export const getExpenses = async (req, res) => {
  const expenses = await prisma.expense.findMany();
  res.json(expenses);
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
        date: dateValue
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    const errMsg = error && error.stack ? error.stack : String(error);
    console.error('addExpense error:', errMsg);
    try {
      const logPath = 'server_addExpense_error.log';
      fs.appendFileSync(logPath, new Date().toISOString() + "\n" + errMsg + "\n----\n");
    } catch (e) {
      console.error('Failed writing error log:', e);
    }
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


