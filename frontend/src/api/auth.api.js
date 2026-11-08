import api from "./api";

const USER_KEY = "bw-user";
const USER_ID_KEY = "bw-user-id";

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

// POST /api/auth/register
export async function signupUser({ name, email, password }) {
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
  });

  return response;
}

// POST /api/auth/login
export async function loginUser({ email, password }) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const user = response.data;

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_ID_KEY, String(user.id));

  return {
    ...response,
    user,
  };
}

// POST /api/auth/logout
export async function logoutUser() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearStoredUser();
  }
}

export async function forgotPasswordUser(email) {
  return api.post("/auth/forgot-password", { email });
}

export async function resetPasswordUser(token, password) {
  return api.post(`/auth/reset-password/${encodeURIComponent(token)}`, {
    password,
  });
}
