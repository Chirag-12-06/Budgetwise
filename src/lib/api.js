const DEFAULT_API_BASE = "/api";
const AUTH_STORAGE_KEYS = ["bw-user", "bw-user-id", "bw-token"];

function isVercelHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return String(window.location.hostname || "").toLowerCase().endsWith(".vercel.app");
}

function clearStoredAuthSession() {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function getApiBase() {
  const configured = String(import.meta.env.VITE_API_BASE || "").trim();

  // On Vercel, use same-origin /api so vercel.json rewrites proxy requests to backend.
  if (isVercelHost() && configured.startsWith("http")) {
    return DEFAULT_API_BASE;
  }

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
    if (response.status === 401) {
      clearStoredAuthSession();
    }

    throw new Error(data?.details || data?.error || data?.message || "Request failed");
  }

  return data;
}

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
  const params = new URLSearchParams();

  if (options.from) {
    params.set("from", String(options.from));
  }

  if (options.to) {
    params.set("to", String(options.to));
  }

  if (options.groupBy) {
    params.set("groupBy", String(options.groupBy));
  }

  const query = params.toString();
  return apiRequest(`/expenses${query ? `?${query}` : ""}`);
}

export async function createExpense(payload) {
  return apiRequest("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createRecurringExpense(payload) {
  return apiRequest("/recurring-expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRecurringExpenses() {
  return apiRequest("/recurring-expenses", {
    method: "GET",
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
