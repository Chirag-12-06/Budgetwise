import api from "./api";

export async function fetchExpenses(options = {}) {
  const params = {};

  if (options.from) params.from = String(options.from);
  if (options.to) params.to = String(options.to);
  if (options.groupBy) params.groupBy = String(options.groupBy);

  return api.get("/transactions", { params });
}

export async function createExpense(payload) {
  return api.post("/transactions", payload);
}

export async function updateExpense(id, payload) {
  return api.put(`/transactions/${id}`, payload);
}

export async function removeExpense(id) {
  return api.delete(`/transactions/${id}`);
}
