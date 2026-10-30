import {
  trainExpenseModelService,
  predictExpenseCategoryService,
  getMlHealthService,
} from "./prediction.service.js";

import { logError } from "../../utils/logger.js";

export async function trainModelController(req, res) {
  try {
    const result = await trainExpenseModelService(req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 503).json({
      error: error.message,
    });
  }
}

export async function predictCategoryController(req, res) {
  try {
    const { title = "", amount = 0 } = req.body || {};

    if (!String(title).trim()) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const result = await predictExpenseCategoryService({
      title,
      amount,
      userId: req.user.id,
    });

    return res.json(result);
  } catch (error) {
    logError("Prediction error:", error);

    return res.json({
      category: "uncategorized",
      confidence: 0,
      fallback: true,
      message: "ML service temporarily unavailable",
    });
  }
}

export async function checkMlHealthController(req, res) {
  try {
    const result = await getMlHealthService();
    return res.json(result);
  } catch (error) {
    logError("ML health check error:", error);

    const status = Number(error?.status || 503);

    return res.status(
      status >= 400 && status < 600 ? status : 503,
    ).json({
      error: error.message,
    });
  }
}