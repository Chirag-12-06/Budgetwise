import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getExpenses = async (req, res) => {
  const expenses = await prisma.expense.findMany();
  res.json(expenses);
};

export const addExpense = async (req, res) => {
  const { title, amount, category } = req.body;
  const expense = await prisma.expense.create({
    data: { title, amount, category },
  });
  res.json(expense);
};
