import { useEffect, useState } from "react";
import { getPreferences, updatePreferences } from "../../api/preference.api";

const DEFAULT_PREFERENCES = {
  reportingCurrency: "INR",
  timeZone: "Asia/Kolkata",
  language: "en",
  dateFormat: "DD/MM/YYYY",
};

export default function usePreferencesData({ user, authLoading, showStatus }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
useEffect(() => {
  if (authLoading) return;

  if (!user) {
    setPreferences(DEFAULT_PREFERENCES);
    setLoading(false);
    return;
  }

  let ignore = false;

  async function fetchPreferences() {
    setLoading(true);

    try {
      const response = await getPreferences();

      if (!ignore) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...(response.data?.data ?? response.data),
        });
      }
    } catch (error) {
      if (!ignore) {
        showStatus?.(
          error.response?.data?.message || "Failed to load preferences",
          "error",
        );
      }
    } finally {
      if (!ignore) setLoading(false);
    }
  }

  fetchPreferences();

  return () => {
    ignore = true;
  };
}, [user, authLoading]);


  function setPreference(field, value) {
  setPreferences((previous) => {
    const updated = {
      ...previous,
      [field]: value,
    };

    return updated;
  });
}

  async function savePreferences() {
  try {
    setSaving(true);

    await updatePreferences(preferences);

    showStatus?.("Preferences updated successfully", "success");

    return true;
  } catch (error) {
    showStatus?.(
      error.response?.data?.message || "Failed to update preferences",
      "error",
    );

    return false;
  } finally {
    setSaving(false);
  }
}

  return {
    preferences,
    loading,
    saving,
    setPreference,
    savePreferences,
  };
}
