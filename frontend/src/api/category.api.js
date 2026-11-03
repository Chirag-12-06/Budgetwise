import api from "./api";

export async function getCategories() {
  const response = await api.get("/categories");
  return response.data;
}

export async function getCategoryGroups() {
  const response = await api.get("/groups");
  return response.data;
}