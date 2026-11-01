import prisma from "../../config/db.js";

// Create a budget
export const createBudgetService = async (data, userId) => {
  const { categoryIds, ...budgetData } = data;

  return prisma.budget.create({
    data: {
      ...budgetData,
      userId,
      categories: {
        create: categoryIds.map((categoryId) => ({
          category: {
            connect: { id: categoryId },
          },
        })),
      },
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

// Fetch all budgets
export const fetchBudgetsService = async (userId) => {
  return prisma.budget.findMany({
    where: { userId },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Fetch budget by ID
export const fetchBudgetByIdService = async (id, userId) => {
  return prisma.budget.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

// Update budget
export const updateBudgetService = async (id, userId, data) => {
  const { categoryIds, ...budgetData } = data;

  return prisma.$transaction(async (tx) => {
    const existingBudget = await tx.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) return null;

    return tx.budget.update({
      where: { id },
      data: {
        ...budgetData,
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({
              category: {
                connect: { id: categoryId },
              },
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  });
};

// Delete budget
export const deleteBudgetService = async (id, userId) => {
  return prisma.budget.deleteMany({
    where: {
      id,
      userId,
    },
  });
};