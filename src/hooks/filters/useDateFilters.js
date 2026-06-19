import { useState, useEffect } from "react";
import {
  validateCustomDateRange,
  resolveDateRange,
} from "../../utils/dateFilters";
import { useSearchParams } from "react-router-dom";

export default function useDateFilter({
  refreshExpenses,
  handleApiError,
  setSelectedCategoryFilters,
  setActiveDateRange,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateFilterMode, setDateFilterMode] = useState("current:month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");

  useEffect(() => {
  const mode = searchParams.get("mode");

  if (mode && mode !== dateFilterMode) {
    setDateFilterMode(mode);
  }
}, [searchParams]);

  function activateCustomDateRange(from, to) {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    setDateFilterMode("custom");
    setDateRangeError("");
  }

  async function refreshCustomDateExpenses(from, to) {
    setDateRangeError("");
    setDateFilterMode("custom");
    setSelectedCategoryFilters([]);
    const options = { from, to };

    setActiveDateRange(options);
    try {
      await refreshExpenses(options);
    } catch (error) {
      handleApiError(error, "Unable to load expenses for selected date");
    }
  }

  function syncCustomDateFilter(nextFrom, nextTo) {
    const validationError = validateCustomDateRange(nextFrom, nextTo);

    if (validationError) {
      setDateRangeError(validationError);
      return;
    }
    refreshCustomDateExpenses(nextFrom, nextTo);
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

    refreshCustomDateExpenses(customDateFrom, customDateTo);
  }

  async function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);
    setSearchParams({
      mode: modeValue,
    });

    setSelectedCategoryFilters([]);

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }

    setDateRangeError("");

    const { startDate, endDate } = resolveDateRange({
      dateFilterMode: modeValue,
      customDateFrom,
      customDateTo,
    });

    let options = {
      from: startDate?.toISOString().split("T")[0],
      to: endDate?.toISOString().split("T")[0],
    };

    setActiveDateRange(options);

    try {
      await refreshExpenses(options);
    } catch (error) {
      handleApiError(
        error,
        "Unable to load expenses for the selected date range",
      );
    }

    try {
      setActiveDateRange(options);
      await refreshExpenses(options);
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
    activateCustomDateRange,
    setCustomDateFrom,
    setCustomDateTo,
    setDateRangeError,
  };
}
