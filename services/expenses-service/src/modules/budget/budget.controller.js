import {
  createBudgetService,
  fetchBudgetsService,
  fetchBudgetByIdService,
  updateBudgetService,
  deleteBudgetService,
} from "./budget.service.js";

import asyncHandler from "../../../../utils/asyncHandler.js";

// Create budget
export const createBudgetController = asyncHandler(async (req, res) => {
  const budget = await createBudgetService(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: budget,
  });
});

// Get all budgets
export const getAllBudgetsController = asyncHandler(async (req, res) => {
  const budgets = await fetchBudgetsService(req.user.id);

  res.status(200).json({
    success: true,
    data: budgets,
  });
});

// Get budget by ID
export const getByIdBudgetController = asyncHandler(async (req, res) => {
  const budget = await fetchBudgetByIdService(req.params.id, req.user.id);

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: "Budget not found",
    });
  }

  res.status(200).json({
    success: true,
    data: budget,
  });
});

// Update budget
export const updateBudgetController = asyncHandler(async (req, res) => {
  const budget = await updateBudgetService(
    req.params.id,
    req.user.id,
    req.body
  );

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: "Budget not found",
    });
  }

  res.status(200).json({
    success: true,
    data: budget,
    message: "Budget updated successfully",
  });
});

// Delete budget
export const removeBudgetController = asyncHandler(async (req, res) => {
  const result = await deleteBudgetService(req.params.id, req.user.id);

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Budget not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Budget deleted successfully",
  });
});