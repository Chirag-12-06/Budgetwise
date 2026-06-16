import { useState } from "react";

export default function applyDateFilter({
  refreshExpenses,
  handleApiError,
  setSelectedCategoryFilters,
}) {
  const [dateFilterMode, setDateFilterMode] = useState("month:current");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");

  function formatLocalDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getPresetDateRange(modeValue, now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();

    if (modeValue === "thisMonth") {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
      };
    }

    if (modeValue === "lastMonth") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
      };
    }

    if (modeValue === "thisYear") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
      };
    }

    return null;
  }

  function syncCustomDateFilter(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) {
      setDateRangeError("Select both From and To dates to apply filter");
      return;
    }

    if (new Date(nextFrom) > new Date(nextTo)) {
      setDateRangeError("From date cannot be later than To date");
      return;
    }

    setDateRangeError("");
    setDateFilterMode("custom");
    setSelectedCategoryFilters([]);

    void refreshExpenses().catch((error) => {
      handleApiError(error, "Unable to load expenses for selected date");
    });
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
    setDateRangeError("");
    setDateFilterMode("custom");
    setSelectedCategoryFilters([]);

    void refreshExpenses().catch((error) => {
      handleApiError(error, "Unable to load expenses for selected date");
    });
  }

  async function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);
    setSelectedCategoryFilters([]);

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }

    setDateRangeError("");

    const presetRange = getPresetDateRange(modeValue);
    if (!presetRange && modeValue === "custom") {
      return;
    }

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
