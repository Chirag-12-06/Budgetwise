import express from "express";

import {
  createBudgetController,
  getAllBudgetsController,
  getByIdBudgetController,
  updateBudgetController,
  removeBudgetController,
} from "./budget.controller.js";

const router = express.Router();

router.post("/", createBudgetController);

router.get("/", getAllBudgetsController);
router.get("/:id", getByIdBudgetController);

router.put("/:id", updateBudgetController);
router.delete("/:id", removeBudgetController);

export { router };