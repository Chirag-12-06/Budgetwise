import PreferenceContext from "../context/PreferenceContext";
import usePreferencesData from "../hooks/profile/usePreferencesData";

export default function PreferencesProvider({ children, showStatus }) {
  const preferencesData = usePreferencesData(showStatus);

  return (
    <PreferenceContext.Provider value={preferencesData}>
      {children}
    </PreferenceContext.Provider>
  );
}