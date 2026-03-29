function resolveDateRange({ dateFilterMode, customDateFrom, customDateTo, now = new Date() }) {
  if (dateFilterMode === "allTime") {
    return { startDate: null, endDate: null };
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
      startDate = new Date(customDateFrom);
      startDate.setHours(0, 0, 0, 0);
    }
    if (customDateTo) {
      endDate = new Date(customDateTo);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
}

export function applyDateFilter(list, options) {
  const source = Array.isArray(list) ? list : [];
  const { startDate, endDate } = resolveDateRange(options);

  if (!startDate && !endDate) {
    return source;
  }

  return source.filter((expense) => {
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

  if (customDateFrom && customDateTo && new Date(customDateFrom) > new Date(customDateTo)) {
    return "From date cannot be later than To date";
  }

  return null;
}
