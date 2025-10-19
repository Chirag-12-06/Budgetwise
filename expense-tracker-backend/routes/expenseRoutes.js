// routes/expenseRoutes.js
import express from "express";
import { getExpenses, addExpense, deleteExpense, updateExpense } from "../controllers/expenseController.js";

const router = express.Router();

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an expense by id
 */
router.put("/:id", updateExpense);


/**
 * @route   GET /api/expenses
 * @desc    Fetch all expenses
 */
router.get("/", getExpenses);

/**
 * @route   POST /api/expenses
 * @desc    Add a new expense
 */
router.post("/", addExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense by id
 */
router.delete("/:id", deleteExpense);


export default router;
