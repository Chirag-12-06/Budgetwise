import api from "./api";

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