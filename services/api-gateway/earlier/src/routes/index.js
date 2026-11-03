import { Router } from "express";

import {router as authRoutes} from "../modules/auth/auth.routes.js";
import {router as expensesRoutes} from "../modules/expenses/expenses.routes.js";
import {router as ocrRoutes} from "../modules/ocr/ocr.routes.js";
import {router as predictionRoutes} from "../modules/prediction/prediction.routes.js";
import {router as recurringExpensesRoutes} from "../modules/recurring-expenses/recurring-expenses.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/expenses", expensesRoutes);
router.use("/ocr", ocrRoutes);
router.use("/prediction", predictionRoutes);
router.use("/recurring-expenses", recurringExpensesRoutes);

export default router;
