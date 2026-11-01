import express from "express";

import {router as categoryRoutes} from "../modules/category/category.routes.js";
import {router as groupRoutes} from "../modules/group/group.routes.js";
import {router as transactionRoutes} from "../modules/transaction/transaction.routes.js";
import {router as budgetRoutes} from "../modules/budget/budget.routes.js";

const router = express.Router();

router.use("/categories", categoryRoutes);
router.use("/groups", groupRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);

export default router;