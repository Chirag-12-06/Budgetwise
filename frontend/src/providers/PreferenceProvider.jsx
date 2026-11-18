import PreferenceContext from "../context/PreferenceContext";
import usePreferencesData from "../hooks/profile/usePreferencesData";

export default function PreferenceProvider({ children }) {
  const preferencesData = usePreferencesData();

  return (
    <PreferenceContext.Provider value={preferencesData}>
      {children}
    </PreferenceContext.Provider>
  );
}
