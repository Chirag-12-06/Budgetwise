import { useState } from "react";
import { validateCustomDateRange } from "../../utils/dateFilters";

export default function useDateFilter({
  refreshExpenses,
  handleApiError,
  setSelectedCategoryFilters,
}) {
  const [dateFilterMode, setDateFilterMode] = useState("month:current");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");

  async function refreshCustomDateExpenses() {
  setDateRangeError("");
  setDateFilterMode("custom");
  setSelectedCategoryFilters([]);

  try {
    await refreshExpenses();
  } catch (error) {
    handleApiError(error, "Unable to load expenses for selected date");
  }
}

  function syncCustomDateFilter(nextFrom, nextTo) {
    const validationError = validateCustomDateRange(
  nextFrom,
  nextTo,
);

if (validationError) {
  setDateRangeError(validationError);
  return;
}
    refreshCustomDateExpenses();
  }

  function handleCustomDateFromChange(value) {
    const nextFrom = value;
    let nextTo = customDateTo;

    if (value && (!nextTo || new Date(value) > new Date(nextTo))) {
      nextTo = value;
      setCustomDateTo(value);
    }

    setCustomDateFrom(nextFrom);
    syncCustomDateFilter(nextFrom, nextTo);
  }

  function handleCustomDateToChange(value) {
    const nextTo = value;
    let nextFrom = customDateFrom;

    if (value && (!nextFrom || new Date(value) < new Date(nextFrom))) {
      nextFrom = value;
      setCustomDateFrom(value);
    }

    setCustomDateTo(nextTo);
    syncCustomDateFilter(nextFrom, nextTo);
  }

  function applyCustomDateRange() {
    const validationError = validateCustomDateRange(
      customDateFrom,
      customDateTo,
    );
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }
    refreshCustomDateExpenses();
  }

  async function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);
    setSelectedCategoryFilters([]);

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }

    setDateRangeError("");
    
    try {
      await refreshExpenses();
    } catch (error) {
      handleApiError(
        error,
        "Unable to load expenses for the selected date range",
      );
    }
  }
  return {
    dateFilterMode,
    setDateFilterMode,
    customDateFrom,
    customDateTo,
    dateRangeError,
    handleCustomDateFromChange,
    handleCustomDateToChange,
    applyCustomDateRange,
    handleDateFilterModeChange,
  };
}
