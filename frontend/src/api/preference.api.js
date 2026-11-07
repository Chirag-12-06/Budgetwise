import api from "./api";

export async function getPreferences() {
  const response = await api.get("/preferences");
  return response.data;
}
