import { formatDateKey } from "./date";

function parseDateOnly(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function parseDateBoundary(value, boundary) {
  const dateOnly = parseDateOnly(value);
  if (dateOnly) {
    const hours = boundary === "end" ? 23 : 0;
    const minutes = boundary === "end" ? 59 : 0;
    const seconds = boundary === "end" ? 59 : 0;
    const milliseconds = boundary === "end" ? 999 : 0;
    return new Date(
      dateOnly.year,
      dateOnly.month - 1,
      dateOnly.day,
      hours,
      minutes,
      seconds,
      milliseconds,
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (boundary === "end") {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
}

function getDateKey(value) {
  if (!value) {
    return "";
  }
  return formatDateKey(value);
}

function resolveDateRange({ dateFilterMode, customDateFrom, customDateTo, now = new Date() }) {
  if (dateFilterMode === "allTime") {
    return { startDate: null, endDate: null, dateFilterMode, customDateFrom, customDateTo };
  }

  let startDate = null;
  let endDate = null;

  if (dateFilterMode === "thisMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (dateFilterMode === "lastMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (dateFilterMode === "thisYear") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (dateFilterMode === "custom") {
    if (customDateFrom) {
      startDate = parseDateBoundary(customDateFrom, "start");
    }
    if (customDateTo) {
      endDate = parseDateBoundary(customDateTo, "end");
    }
  }

  return { startDate, endDate, dateFilterMode, customDateFrom, customDateTo };
}

export function applyDateFilter(list, options) {
  const source = Array.isArray(list) ? list : [];
  const { startDate, endDate, dateFilterMode, customDateFrom, customDateTo } = resolveDateRange(options);

  if (!startDate && !endDate) {
    return source;
  }

  return source.filter((expense) => {
    const expenseDateKey = getDateKey(expense.createdAt);
    if (dateFilterMode === "custom") {
      if (startDate) {
        const startKey = getDateKey(customDateFrom);
        if (startKey && expenseDateKey < startKey) return false;
      }

      if (endDate) {
        const endKey = getDateKey(customDateTo);
        if (endKey && expenseDateKey > endKey) return false;
      }

      return true;
    }

    const expenseDate = new Date(expense.createdAt);
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    return true;
  });
}

export function validateCustomDateRange(customDateFrom, customDateTo) {
  if (!customDateFrom && !customDateTo) {
    return "Choose at least one date to apply a custom range";
  }

  const fromDate = customDateFrom ? parseDateBoundary(customDateFrom, "start") : null;
  const toDate = customDateTo ? parseDateBoundary(customDateTo, "start") : null;

  if (fromDate && toDate && fromDate > toDate) {
    return "From date cannot be later than To date";
  }

  return null;
}
