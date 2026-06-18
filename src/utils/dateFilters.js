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

  let startDate = null;
  let endDate = null;

  // Support composite modes like "month:current", "week:previous", "day:current", "year:previous"
  if (dateFilterMode === "custom") {
    if (customDateFrom) {
      startDate = parseDateBoundary(customDateFrom, "start");
    }
    if (customDateTo) {
      endDate = parseDateBoundary(customDateTo, "end");
    }
    return { startDate, endDate, dateFilterMode, customDateFrom, customDateTo };
  }

  const normalized = String(dateFilterMode || "");
  if (normalized.includes(":")) {
    const [period, relative] = normalized.split(":");
    const year = now.getFullYear();
    const month = now.getMonth();

    if (period === "month") {
      if (relative === "current") {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      } else {
        // previous
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      }
    } else if (period === "year") {
      if (relative === "current") {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      } else {
        startDate = new Date(year - 1, 0, 1);
        endDate = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      }
    } else if (period === "week") {
      // Treat week as Monday - Sunday
      const day = now.getDay();
      const daysSinceMonday = (day + 6) % 7;
      const thisMonday = new Date(now);
      thisMonday.setHours(0, 0, 0, 0);
      thisMonday.setDate(now.getDate() - daysSinceMonday);

      if (relative === "current") {
        startDate = new Date(thisMonday);
        endDate = new Date(thisMonday);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const prevMonday = new Date(thisMonday);
        prevMonday.setDate(prevMonday.getDate() - 7);
        startDate = new Date(prevMonday);
        endDate = new Date(prevMonday);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === "day") {
      if (relative === "current") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
      }
    }
  } else if (dateFilterMode === "thisMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (dateFilterMode === "lastMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (dateFilterMode === "thisYear") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
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
    console.warn("Invalid custom date range encountered");
  }

  return "Invalid date range";
}
