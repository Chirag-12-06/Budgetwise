import prisma from "../../config/db.js";

export const createTransaction = async (data, userId) => {
  return prisma.transaction.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const fetchTransactionsService = async (userId) => {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { transactionDate: "desc" },
  });
};

export const fetchTransactionsByCategoryService = async (categoryId, userId) => {
  return prisma.transaction.findMany({
    where: {
      userId,
      categoryId,
    },
    orderBy: { transactionDate: "desc" },
  });
};

export const fetchTransactionsByGroupService = async (groupId, userId) => {
  return prisma.transaction.findMany({
    where: {
      userId,
      category: {
        groupId,
      },
    },
    orderBy: { transactionDate: "desc" },
  });
};

export const fetchTransactionByIdService = async (id, userId) => {
  return prisma.transaction.findFirst({
    where: { id, userId },
  });
};

export const updateTransactionService = async (id, userId, data) => {
  return prisma.transaction.updateMany({
    where: { id, userId },
    data,
  });
};

export const deleteTransactionService = async (id, userId) => {
  return prisma.transaction.deleteMany({
    where: { id, userId },
  });
};
