import {
  createTransactionService,
  fetchTransactionsService,
  fetchTransactionsByCategoryService,
  fetchTransactionsByGroupService,
  fetchTransactionByIdService,
  updateTransactionService,
  deleteTransactionService,
} from "./transaction.service.js";

import asyncHandler from "../../utils/asyncHandler.js";

export const createTransactionController = asyncHandler(async (req, res) => {
  const transaction = await createTransactionService(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

export const getAllTransactionsController = asyncHandler(async (req, res) => {
  console.log("Authenticated user:", req.user);

  const transactions = await fetchTransactionsService(req.user.id);

  res.status(200).json({
    success: true,
    data: transactions,
  });
});

export const getByCategoryTransactionController = asyncHandler(async (req, res) => {
  const transactions = await fetchTransactionsByCategoryService(
    req.params.categoryId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: transactions,
  });
});

export const getByGroupTransactionController = asyncHandler(async (req, res) => {
  const transactions = await fetchTransactionsByGroupService(
    req.params.groupId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: transactions,
  });
});

export const getByIdTransactionController = asyncHandler(async (req, res) => {
  const transaction = await fetchTransactionByIdService(
    req.params.id,
    req.user.id
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found",
    });
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

export const updateTransactionController = asyncHandler(async (req, res) => {
  const result = await updateTransactionService(
    req.params.id,
    req.user.id,
    req.body
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Transaction updated successfully",
  });
});

export const removeTransactionController = asyncHandler(async (req, res) => {
  const result = await deleteTransactionService(
    req.params.id,
    req.user.id
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Transaction deleted successfully",
  });
});