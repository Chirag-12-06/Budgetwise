import {
  createRecurringExpenseService,
  fetchRecurringExpensesService,
  fetchRecurringExpenseByIdService,
  updateRecurringExpenseService,
  deleteRecurringExpenseService,
} from "./recurring.service.js";

import asyncHandler from "../../utils/asyncHandler.js";

// Create recurring expense
export const createRecurringExpenseController = asyncHandler(async (req, res) => {
  const recurringExpense = await createRecurringExpenseService(
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: recurringExpense,
  });
});

// Get all recurring expenses
export const getAllRecurringExpenseController = asyncHandler(async (req, res) => {
  const recurringExpenses = await fetchRecurringExpensesService(req.user.id);

  res.status(200).json({
    success: true,
    data: recurringExpenses,
  });
});

// Get recurring expense by ID
export const getByIdRecurringExpenseController = asyncHandler(async (req, res) => {
  const recurringExpense = await fetchRecurringExpenseByIdService(
    req.params.id,
    req.user.id
  );

  if (!recurringExpense) {
    return res.status(404).json({
      success: false,
      message: "Recurring expense not found",
    });
  }

  res.status(200).json({
    success: true,
    data: recurringExpense,
  });
});

// Update recurring expense
export const updateRecurringExpenseController = asyncHandler(async (req, res) => {
  const result = await updateRecurringExpenseService(
    req.params.id,
    req.user.id,
    req.body
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Recurring expense not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Recurring expense updated successfully",
  });
});

// Delete recurring expense
export const removeRecurringExpenseController = asyncHandler(async (req, res) => {
  const result = await deleteRecurringExpenseService(
    req.params.id,
    req.user.id
  );

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Recurring expense not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Recurring expense deleted successfully",
  });
});