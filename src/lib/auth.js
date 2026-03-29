import { apiRequest } from "./api";

const USER_KEY = "bw-user";
const USER_ID_KEY = "bw-user-id";
const TOKEN_KEY = "bw-token";

function storeSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_ID_KEY, user.id);
  localStorage.setItem(TOKEN_KEY, token);
}

export function hasToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loginUser({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  storeSession(data.user, data.token);
  return data;
}

export async function signupUser({ name, email, password }) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  storeSession(data.user, data.token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
