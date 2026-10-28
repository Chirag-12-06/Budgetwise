import api from "./api";

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
