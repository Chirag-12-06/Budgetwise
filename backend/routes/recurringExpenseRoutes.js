import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getRecurringExpenses,
  getRecurringExpenseById,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "../controllers/recurringExpenseController.js";

const router = express.Router();

router.get("/", requireAuth, getRecurringExpenses);
router.get("/:id", requireAuth, getRecurringExpenseById);
router.put("/:id", requireAuth, updateRecurringExpense);
router.delete("/:id", requireAuth, deleteRecurringExpense);

export default router;