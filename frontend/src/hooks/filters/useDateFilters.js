import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  validateCustomDateRange,
  resolveDateRange,
} from "../../utils/dateFilters";

export default function useDateFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateFilterMode, setDateFilterMode] = useState(
    searchParams.get("mode") || "current:month",
  );

  const [customDateFrom, setCustomDateFrom] = useState(
    searchParams.get("from") || "",
  );

  const [customDateTo, setCustomDateTo] = useState(
    searchParams.get("to") || "",
  );

  const [dateRangeError, setDateRangeError] = useState("");

  const activeDateRange = useMemo(() => {
    if (dateFilterMode === "custom") {
      const error = validateCustomDateRange(customDateFrom, customDateTo);

      if (error) return null;

      return {
        from: customDateFrom,
        to: customDateTo,
      };
    }

    const { startDate, endDate } = resolveDateRange({
      dateFilterMode,
      customDateFrom,
      customDateTo,
    });

    return {
      from: startDate?.toISOString().split("T")[0],
      to: endDate?.toISOString().split("T")[0],
    };
  }, [dateFilterMode, customDateFrom, customDateTo]);

  function updateCustomDateRange(from, to) {
    const error = validateCustomDateRange(from, to);

    if (error) {
      setDateRangeError(error);
      return;
    }

    setDateRangeError("");
    setDateFilterMode("custom");

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      next.set("mode", "custom");
      next.set("from", from);
      next.set("to", to);

      return next;
    });
  }

  function activateCustomDateRange(from, to) {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    updateCustomDateRange(from, to);
  }

  function handleCustomDateFromChange(value) {
    const nextTo =
      value && (!customDateTo || value > customDateTo) ? value : customDateTo;

    setCustomDateFrom(value);

    if (nextTo !== customDateTo) {
      setCustomDateTo(nextTo);
    }

    updateCustomDateRange(value, nextTo);
  }

  function handleCustomDateToChange(value) {
    const nextFrom =
      value && (!customDateFrom || value < customDateFrom)
        ? value
        : customDateFrom;

    setCustomDateTo(value);

    if (nextFrom !== customDateFrom) {
      setCustomDateFrom(nextFrom);
    }

    updateCustomDateRange(nextFrom, value);
  }

  function applyCustomDateRange() {
    updateCustomDateRange(customDateFrom, customDateTo);
  }

  function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);
    setDateRangeError("");

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");

      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);

        next.set("mode", modeValue);
        next.delete("from");
        next.delete("to");

        return next;
      });
    }
  }

  return {
    dateFilterMode,
    setDateFilterMode,
    customDateFrom,
    customDateTo,
    dateRangeError,
    activeDateRange,
    handleCustomDateFromChange,
    handleCustomDateToChange,
    applyCustomDateRange,
    handleDateFilterModeChange,
    activateCustomDateRange,
    setCustomDateFrom,
    setCustomDateTo,
    setDateRangeError,
  };
}
