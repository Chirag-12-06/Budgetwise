import useCategoryFilters from "./expenses/useCategoryFilters";

export default function useFilter() {
  const {
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    handleCategoryFilterToggle,
    clearCategoryFilters,
  } = useCategoryFilters();
  
const monthSpent = expenses
    .filter((expense) => {
      const created = new Date(expense.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const latestExpenses = [...expenses]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);
  const { startDate, endDate } = resolveDateRange({
    dateFilterMode,
    customDateFrom,
    customDateTo,
  });
  const dateFilteredExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.createdAt);

      if (startDate && expenseDate < startDate) {
        return false;
      }

      if (endDate && expenseDate > endDate) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    );
  const filteredExpenses = selectedCategoryFilters.length
    ? dateFilteredExpenses.filter((expense) =>
        selectedCategoryFilters.includes(expense.category || "uncategorized"),
      )
    : dateFilteredExpenses;
  const emptyFilteredState =
    filteredExpenses.length === 0 && expenses.length > 0;
  const analyticsExpenses = filteredExpenses;
  const analyticsTotal = analyticsExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const categoryTotals = analyticsExpenses.reduce((accumulator, expense) => {
    const key = expense.category || "uncategorized";
    accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});
  const groupedTrendMap = analyticsExpenses.reduce((accumulator, expense) => {
    const expenseDateKey = formatDateKey(expense.createdAt);
    const [yearPart = "", monthPart = ""] = String(expenseDateKey).split("-");
    let key;
    if (analyticsGroupBy === "yearly") {
      key = yearPart;
    } else if (analyticsGroupBy === "monthly") {
      key = `${yearPart}-${monthPart}`;
    } else if (analyticsGroupBy === "weekly") {
      const date = new Date(expense.createdAt);

      // Monday start
      const day = date.getDay();
      const offset = day === 0 ? 6 : day - 1;

      date.setDate(date.getDate() - offset);

      key = formatDateKey(date);
    } else {
      key = expenseDateKey;
    }
    accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});
  const trendData = Object.entries(groupedTrendMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucketKey, value]) => {
      const point = {
        bucketKey,
        label: formatTrendLabel(bucketKey, analyticsGroupBy),
        value,
      };

      if (analyticsGroupBy === "daily") {
        return {
          ...point,
          dateKey: bucketKey,
          rangeFrom: bucketKey,
          rangeTo: bucketKey,
        };
      }

      if (analyticsGroupBy === "weekly") {
        const start = new Date(bucketKey);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return {
          ...point,
          dateKey: "",
          rangeFrom: formatDateKey(start),
          rangeTo: formatDateKey(end),
        };
      }

      if (analyticsGroupBy === "monthly") {
        const [year, month] = bucketKey.split("-");
        const endDay = new Date(Number(year), Number(month), 0).getDate();
        const monthStart = `${year}-${month}-01`;
        const monthEnd = `${year}-${month}-${String(endDay).padStart(2, "0")}`;
        return {
          ...point,
          dateKey: "",
          rangeFrom: monthStart,
          rangeTo: monthEnd,
        };
      }

      const yearStart = `${bucketKey}-01-01`;
      const yearEnd = `${bucketKey}-12-31`;
      return {
        ...point,
        dateKey: "",
        rangeFrom: yearStart,
        rangeTo: yearEnd,
      };
    });
  const maxTrendValue = trendData.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0,
  );

  return {
    selectedCategoryFilters,
    filteredExpenses,
    emptyFilteredState,
    analyticsExpenses,
    analyticsTotal,
    categoryTotals,
    trendData,
    maxTrendValue,
    handleCategoryFilterToggle,
    clearCategoryFilters,
  };
}
