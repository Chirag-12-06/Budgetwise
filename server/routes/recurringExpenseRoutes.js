import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getRecurringExpenses,
  deleteRecurringExpense,
} from "../controllers/recurringExpenseController.js";

const router = express.Router();

router.get("/", requireAuth, getRecurringExpenses);
router.delete("/:id", requireAuth, deleteRecurringExpense);

export default router;