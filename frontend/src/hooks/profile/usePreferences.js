import { useEffect, useState } from "react";
import {
  getPreferences,
  updatePreferences,
} from "../../api/preference.api";

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

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getPreferences();

        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...(data.data ?? data),
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

  // Update local state
  const setPreference = (field, value) => {
    setPreferences((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);

      const data = await updatePreferences(preferences);

      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(data.data ?? data),
      });

      showStatus?.("Preferences updated successfully", "success");

      return true;
    } catch (error) {
      showStatus?.(
        error.response?.data?.message || "Failed to update preferences",
        "error"
      );

      return false;
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