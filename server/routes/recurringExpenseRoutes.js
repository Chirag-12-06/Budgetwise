import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { addRecurringExpense } from "../controllers/recurringExpenseController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", addRecurringExpense);

export default router;