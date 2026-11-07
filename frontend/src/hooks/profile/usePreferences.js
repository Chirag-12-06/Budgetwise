import { useEffect, useState } from "react";
import api from "../../api/api";

const DEFAULT_PREFERENCES = {
  reportingCurrency: "INR",
  timeZone: "Asia/Kolkata",
  language: "en",
  dateFormat: "DD/MM/YYYY",
};

export default function usePreferences(showStatus) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences when the component mounts
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get("/preferences");

        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...response.data.data,
        });
      } catch (error) {
        showStatus?.(
          error.response?.data?.message || "Failed to load preferences",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Update a single preference in local state
  const setPreference = (field, value) => {
    setPreferences((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Save preferences to backend
  const savePreferences = async () => {
    try {
      setSaving(true);

      const response = await api.put("/preferences", preferences);

      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...response.data.data,
      });

      showStatus?.("Preferences updated successfully", "success");
    } catch (error) {
      showStatus?.(
        error.response?.data?.message || "Failed to update preferences",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    setPreference,
    savePreferences,
  };
}