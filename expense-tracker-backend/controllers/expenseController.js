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

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Error deleting expense" });
  }
};
