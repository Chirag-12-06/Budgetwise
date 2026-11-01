import prisma from "../../config/db.js";
import {
  generateUpcomingOccurrences,
} from "../occurrences/occurrence.service.js";

// Create recurring expense
export const createRecurringExpenseService = async (data, userId) => {
  return prisma.$transaction(async (tx) => {
    const recurringExpense = await tx.recurringExpense.create({
      data: {
        ...data,
        userId,
      },
    });

    await generateUpcomingOccurrences(tx, recurringExpense);

    return recurringExpense;
  });
};

// Fetch all recurring expenses
export const fetchRecurringExpensesService = async (userId) => {
  return prisma.recurringExpense.findMany({
    where: { userId },
    include: {
      occurrences: {
        orderBy: {
          scheduledDate: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Fetch recurring expense by ID
export const fetchRecurringExpenseByIdService = async (id, userId) => {
  return prisma.recurringExpense.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      occurrences: {
        orderBy: {
          scheduledDate: "asc",
        },
      },
    },
  });
};

// Update recurring expense
export const updateRecurringExpenseService = async (id, userId, data) => {
  return prisma.$transaction(async (tx) => {
    const existingExpense = await tx.recurringExpense.findFirst({
      where: { id, userId },
    });

    if (!existingExpense) return null;

    const updatedExpense = await tx.recurringExpense.update({
      where: { id },
      data,
    });

    // Regenerate future occurrences after recurrence changes.
    // We'll implement this after defining the generation rules.
    return updatedExpense;
  });
};

// Delete recurring expense
export const deleteRecurringExpenseService = async (id, userId) => {
  return prisma.recurringExpense.deleteMany({
    where: {
      id,
      userId,
    },
  });
};