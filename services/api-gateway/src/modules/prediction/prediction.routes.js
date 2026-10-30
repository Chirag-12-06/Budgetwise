import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";

import {
  trainModelController,
  predictCategoryController,
  checkMlHealthController,
} from "./prediction.controller.js";

const router = Router();

router.post("/train-model", requireAuth, trainModelController);
router.post("/predict-category", requireAuth, predictCategoryController);
router.get("/ml-health", checkMlHealthController);

export default router;