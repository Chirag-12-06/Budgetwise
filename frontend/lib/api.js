import api from "./apiClient";

export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export async function fetchExpenses(options = {}) {
  const params = {};

  if (options.from) params.from = String(options.from);
  if (options.to) params.to = String(options.to);
  if (options.groupBy) params.groupBy = String(options.groupBy);

  return api.get("/expenses", { params });
}

export async function createExpense(payload) {
  return api.post("/expenses", payload);
}

export async function updateExpense(id, payload) {
  return api.put(`/expenses/${id}`, payload);
}

export async function removeExpense(id) {
  return api.delete(`/expenses/${id}`);
}

export async function createRecurringExpense(payload) {
  return api.post("/recurring-expenses", payload);
}

export async function fetchRecurringExpenses() {
  return api.get("/recurring-expenses");
}

export async function fetchRecurringExpense(id) {
  return api.get(`/recurring-expenses/${id}`);
}

export async function updateRecurringExpense(id, payload) {
  return api.put(`/recurring-expenses/${id}`, payload);
}

export async function removeRecurringExpense(id) {
  return api.delete(`/recurring-expenses/${id}`);
}

export async function trainExpenseModel() {
  return api.post("/train-model", {});
}

export async function predictExpenseCategory({ title, amount }) {
  return api.post("/predict-category", { title, amount });
}

export async function processReceipt(imageB64, filename) {
  return api.post("/process-receipt", {
    image_b64: imageB64,
    filename,
  });
}