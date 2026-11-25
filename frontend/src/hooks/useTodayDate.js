import usePreferences from "./profile/usePreferences";
import { getTodayDate } from "../utils/date";

export default function useTodayDate() {
  const { preferences } = usePreferences();

  return getTodayDate(preferences?.timeZone || "Asia/Kolkata");
}
