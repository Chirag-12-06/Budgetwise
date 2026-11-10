import api from "./api";

const USER_KEY = "bw-user";
const USER_ID_KEY = "bw-user-id";

function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_ID_KEY, String(user.id));
}

// GET /api/users/profile
export async function getCurrentUser() {
  const response = await api.get("/users/profile");

  const user = response.data;

  storeUser(user);

  return user;
}

// PUT /api/users/profile
export async function updateProfileUser({ name, avatarUrl }) {
  const response = await api.put("/users/profile", {
    name,
    avatarUrl,
  });

  const user = response.data;

  storeUser(user);

  return {
    ...response,
    user,
  };
}