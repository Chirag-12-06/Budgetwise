// routes/expenseRoutes.js
import express from "express";
import { getExpenses, addExpense, deleteExpense, updateExpense } from "./expense.controller.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getExpenses);

router.put("/:id", updateExpense);

router.post("/", addExpense);

router.delete("/:id", deleteExpense);


export default router;
