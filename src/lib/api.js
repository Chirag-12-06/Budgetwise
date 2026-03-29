const DEFAULT_API_BASE = "http://localhost:5000/api";

export function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE;
  return (configured || DEFAULT_API_BASE).replace(/\/$/, "");
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("bw-token");
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export async function fetchExpenses() {
  return apiRequest("/expenses");
}

export async function createExpense(payload) {
  return apiRequest("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trainExpenseModel() {
  return apiRequest("/train-model", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function predictExpenseCategory({ title, amount }) {
  return apiRequest("/predict-category", {
    method: "POST",
    body: JSON.stringify({ title, amount }),
  });
}

export async function updateExpense(id, payload) {
  return apiRequest(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removeExpense(id) {
  return apiRequest(`/expenses/${id}`, {
    method: "DELETE",
  });
}
