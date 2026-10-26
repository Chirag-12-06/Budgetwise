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

function removeAvatarForEmail(email) {
  if (!email) {
    return;
  }

  const key = String(email).toLowerCase();
  const current = readAvatarMap();
  if (!(key in current)) {
    return;
  }

  const next = { ...current };
  delete next[key];
  writeAvatarMap(next);
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
    body: JSON.stringify({ name, email, password, avatarDataUrl: avatarDataUrl || null }),
  });

  if (data.user?.avatarDataUrl) {
    saveAvatarForEmail(data.user.email || email, data.user.avatarDataUrl);
  } else if (avatarDataUrl) {
    saveAvatarForEmail(email, avatarDataUrl);
  }

  const userWithAvatar = {
    ...data.user,
    avatarDataUrl: data.user?.avatarDataUrl || avatarDataUrl || getAvatarForEmail(email),
  };

  storeSession(userWithAvatar, data.token);
  return { ...data, user: userWithAvatar };
}

export async function forgotPasswordUser(email) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to send reset link");
  }

  return data;
}

export async function resetPasswordUser(token, password) {
  const response = await fetch(
    `/api/auth/reset-password/${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to reset password");
  }

  return data;
}

export async function updateProfileUser({ name, email, avatarDataUrl }) {
  const previousUser = getStoredUser();
  const previousEmail = previousUser?.email || "";

  const data = await apiRequest("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({
      name,
      email,
      avatarDataUrl: avatarDataUrl !== undefined ? avatarDataUrl : undefined,
    }),
  });

  const nextEmail = data?.user?.email || email;

  if (previousEmail && previousEmail !== nextEmail && previousUser?.avatarDataUrl) {
    saveAvatarForEmail(nextEmail, previousUser.avatarDataUrl);
  }

  if (avatarDataUrl !== undefined) {
    if (avatarDataUrl) {
      saveAvatarForEmail(nextEmail, avatarDataUrl);
    } else {
      removeAvatarForEmail(nextEmail);
    }
  }

  if (previousEmail && previousEmail !== nextEmail) {
    removeAvatarForEmail(previousEmail);
  }

  const resolvedAvatar =
    data?.user?.avatarDataUrl !== undefined
      ? data.user.avatarDataUrl || ""
      : avatarDataUrl !== undefined
        ? avatarDataUrl
        : previousUser?.avatarDataUrl || getAvatarForEmail(nextEmail);

  const userWithAvatar = {
    ...data.user,
    avatarDataUrl: resolvedAvatar || "",
  };

  localStorage.setItem(USER_KEY, JSON.stringify(userWithAvatar));
  localStorage.setItem(USER_ID_KEY, String(userWithAvatar.id));

  return { ...data, user: userWithAvatar };
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
