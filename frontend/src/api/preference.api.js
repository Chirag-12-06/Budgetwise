import api from "./api";

export async function getPreferences() {
  const response = await api.get("/preferences");
  return response.data;
}

export async function updatePreferences(preferences) {
  const {
    reportingCurrency,
    timeZone,
    dateFormat,
    language,
  } = preferences;

  const response = await api.put("/preferences", {
    reportingCurrency,
    timeZone,
    dateFormat,
    language,
  });

  return response.data;
}
