import api from "./api";

const USER_KEY = "bw-user";
const USER_ID_KEY = "bw-user-id";

function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_ID_KEY, String(user.id));
}

export async function getCurrentUser() {
  console.count("getCurrentUser called");

  console.trace("getCurrentUser call stack");

  const response = await api.get("/users/profile");

  const user = response.data;

  storeUser(user);

  return user;
}

export async function updateProfileUser({ name, avatarUrl }) {
  const response = await api.put("/users/profile", {
    name,
    avatarUrl,
  });

  const user = response.data;

  storeUser(user);

  return { user };
}
