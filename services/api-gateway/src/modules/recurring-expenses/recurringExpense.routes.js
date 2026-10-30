import express from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";
import {
  addRecurringExpense,
  getRecurringExpenses,
  getRecurringExpenseById,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "./recurringExpense.controller.js";

const router = express.Router();

router.get("/", requireAuth, getRecurringExpenses);
router.get("/:id", requireAuth, getRecurringExpenseById);
router.put("/:id", requireAuth, updateRecurringExpense);
router.post("/", requireAuth, addRecurringExpense);
router.delete("/:id", requireAuth, deleteRecurringExpense);

export default router;