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
  const initialMode = searchParams.get("mode") ?? "current:month";
  const initialFrom = searchParams.get("from") || "";
  const initialTo = searchParams.get("to") || "";
  const [dateFilterMode, setDateFilterMode] = useState(initialMode);
  const [customDateFrom, setCustomDateFrom] = useState(initialFrom);
  const [customDateTo, setCustomDateTo] = useState(initialTo);
  const [dateRangeError, setDateRangeError] = useState("");

  console.log("useDateFilter initial mode:", initialMode);
  useEffect(() => {
  if (!searchParams.get("mode")) {
    setSearchParams({
      mode: "current:month",
    });
  }
}, []);

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

    setSearchParams({
      mode: "custom",
      from,
      to,
    });

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
    if (modeValue !== "custom") {
      setSearchParams({
        mode: modeValue,
      });
    }

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
