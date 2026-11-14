import PreferenceContext from "../context/PreferenceContext";
import usePreferencesData from "../hooks/profile/usePreferencesData";

export default function PreferenceProvider({ children, user, authLoading }) {
  const preferencesData = usePreferencesData({
    user,
    authLoading,
  });

  return (
    <PreferenceContext.Provider value={preferencesData}>
      {children}
    </PreferenceContext.Provider>
  );
}
