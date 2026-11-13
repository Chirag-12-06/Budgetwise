import { useCallback } from "react";
import usePreferences from "./profile/usePreferences";

export default function useFormattedCurrency() {
  const { preferences } = usePreferences();

  const reportingCurrency = preferences?.reportingCurrency || "INR";

  return useCallback(
    (value, locale = "en-IN") => {
      const amount = Number(value);

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: reportingCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number.isFinite(amount) ? amount : 0);
    },
    [reportingCurrency],
  );
}
