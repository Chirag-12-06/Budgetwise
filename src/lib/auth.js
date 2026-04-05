import { apiRequest } from "./api";

const USER_KEY = "bw-user";
const USER_ID_KEY = "bw-user-id";
const TOKEN_KEY = "bw-token";
const AVATAR_MAP_KEY = "bw-avatar-map";

function readAvatarMap() {
  const raw = localStorage.getItem(AVATAR_MAP_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAvatarMap(value) {
  localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(value));
}

function saveAvatarForEmail(email, avatarDataUrl) {
  if (!email || !avatarDataUrl) {
    return;
  }

  const current = readAvatarMap();
  writeAvatarMap({ ...current, [String(email).toLowerCase()]: avatarDataUrl });
}

function getAvatarForEmail(email) {
  if (!email) {
    return "";
  }

  const current = readAvatarMap();
  return current[String(email).toLowerCase()] || "";
}

function storeSession(user, token) {
  const avatarDataUrl = user?.avatarDataUrl || getAvatarForEmail(user?.email);
  const userWithAvatar = avatarDataUrl ? { ...user, avatarDataUrl } : user;
  localStorage.setItem(USER_KEY, JSON.stringify(userWithAvatar));
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
    const parsed = JSON.parse(raw);
    const avatarDataUrl = parsed?.avatarDataUrl || getAvatarForEmail(parsed?.email);
    return avatarDataUrl ? { ...parsed, avatarDataUrl } : parsed;
  } catch {
    return null;
  }
}

export async function loginUser({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const userWithAvatar = {
    ...data.user,
    avatarDataUrl: data.user?.avatarDataUrl || getAvatarForEmail(data.user?.email),
  };
  storeSession(userWithAvatar, data.token);
  return { ...data, user: userWithAvatar };
}

export async function signupUser({ name, email, password, avatarDataUrl }) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (avatarDataUrl) {
    saveAvatarForEmail(email, avatarDataUrl);
  }

  const userWithAvatar = {
    ...data.user,
    avatarDataUrl: avatarDataUrl || getAvatarForEmail(email),
  };

  storeSession(userWithAvatar, data.token);
  return { ...data, user: userWithAvatar };
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
