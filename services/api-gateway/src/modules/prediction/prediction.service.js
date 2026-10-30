import prisma from "../../lib/prisma.js";

const ML_SERVICE_URL = (
  process.env.ML_SERVICE_URL || "http://127.0.0.1:5001"
).replace(/\/+$/, "");

// Low-level HTTP communication
export async function callMlService(
  pathname,
  { method = "GET", body } = {},
) {
  const response = await fetch(`${ML_SERVICE_URL}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.error || result.message || "ML service error",
    );

    error.status = response.status;
    throw error;
  }

  return result;
}

// Business operation: train model
export async function trainExpenseModelService(userId) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
  });

  if (expenses.length < 10) {
    const error = new Error(
      "Need at least 10 expenses to train the model",
    );
    error.status = 400;
    throw error;
  }

  return callMlService("/api/train-model", {
    method: "POST",
    body: {
      expenses,
      user_id: userId,
    },
  });
}

// Business operation: predict expense category
export async function predictExpenseCategoryService({
  title,
  amount,
  userId,
}) {
  return callMlService("/api/predict-category", {
    method: "POST",
    body: {
      title: String(title).trim(),
      amount: Number(amount) || 0,
      user_id: String(userId),
    },
  });
}

// Business operation: check ML service health
export async function getMlHealthService() {
  return callMlService("/health");
}