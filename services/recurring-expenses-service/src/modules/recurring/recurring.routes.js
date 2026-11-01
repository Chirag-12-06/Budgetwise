import express from "express";

import {
  createRecurringExpenseController,
  getAllRecurringExpenseController,
  getByIdRecurringExpenseController,
  updateRecurringExpenseController,
  removeRecurringExpenseController,
} from "./recurring.controller.js";

const router = express.Router();

// Create recurring expense
router.post("/", createRecurringExpenseController);

// Fetch recurring expenses
router.get("/", getAllRecurringExpenseController);

// Fetch recurring expense by ID
router.get("/:id", getByIdRecurringExpenseController);

// Update recurring expense
router.put("/:id", updateRecurringExpenseController);

// Delete recurring expense
router.delete("/:id", removeRecurringExpenseController);

export { router };