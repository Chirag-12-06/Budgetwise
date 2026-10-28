import api from "./api";

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
