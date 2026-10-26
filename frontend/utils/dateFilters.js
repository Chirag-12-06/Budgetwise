import { formatDateKey } from "./date";

function parseDateOnly(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
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

export function resolveDateRange({
  dateFilterMode,
  customDateFrom,
  customDateTo,
}) {
  let startDate = null;
  let endDate = null;
  let now = new Date();

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
    const [relative, period] = normalized.split(":");
    const year = now.getFullYear();
    const month = now.getMonth();
    const isCurrent = relative === "current";

    if (period === "month") {
      const offset = isCurrent ? 0 : -1;

      startDate = new Date(year, month + offset, 1);
      endDate = isCurrent
        ? new Date(now)
        : new Date(year, month + offset + 1, 0, 23, 59, 59, 999);

      if (isCurrent) {
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === "year") {
      const targetYear = isCurrent ? year : year - 1;

      startDate = new Date(targetYear, 0, 1);
      endDate = isCurrent
        ? new Date(now)
        : new Date(targetYear, 11, 31, 23, 59, 59, 999);

      if (isCurrent) {
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === "week") {
      const day = now.getDay();
      const daysSinceMonday = (day + 6) % 7;

      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - daysSinceMonday);

      if (!isCurrent) {
        startDate.setDate(startDate.getDate() - 7);
      }

      endDate = isCurrent ? new Date(now) : new Date(startDate);

      if (!isCurrent) {
        endDate.setDate(endDate.getDate() + 6);
      }

      endDate.setHours(23, 59, 59, 999);
    } else if (period === "day") {
      startDate = new Date(now);

      if (!isCurrent) {
        startDate.setDate(startDate.getDate() - 1);
      }

      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }
  }
  return { startDate, endDate, dateFilterMode, customDateFrom, customDateTo };
}

export function validateCustomDateRange(customDateFrom, customDateTo) {
  if (!customDateFrom && !customDateTo) {
    return "Choose at least one date to apply a custom range";
  }

  const fromDate = customDateFrom
    ? parseDateBoundary(customDateFrom, "start")
    : null;

  const toDate = customDateTo ? parseDateBoundary(customDateTo, "start") : null;

  if (fromDate && toDate && fromDate > toDate) {
    console.warn("Invalid custom date range encountered");
    return "Invalid date range";
  }

  return null;
}
