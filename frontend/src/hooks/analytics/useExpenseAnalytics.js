
import { useMemo } from "react";
import {formatDateKey, formatTrendLabel} from "../../utils/date";

export default function useExpenseAnalytics({
  expenses,
  filteredExpenses,
  analyticsGroupBy,
}) {
  // Calculations based on all expenses
  const monthSpent = useMemo(() => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date || expense.createdAt);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const latestExpenses = useMemo(() => {
    return [...expenses]
      .sort(
        (left, right) =>
          new Date(right.createdAt || right.date) -
          new Date(left.createdAt || left.date),
      )
      .slice(0, 5);
  }, [expenses]);

  // Calculations based on filtered expenses
  const analyticsTotal = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((accumulator, expense) => {
      const key = expense.category || "uncategorized";

      accumulator[key] =
        (accumulator[key] || 0) + Number(expense.amount || 0);

      return accumulator;
    }, {});
  }, [filteredExpenses]);

  const trendData = useMemo(() => {
    const groupedTrendMap = filteredExpenses.reduce(
      (accumulator, expense) => {
        const expenseDate = expense.date || expense.createdAt;
        const expenseDateKey = formatDateKey(expenseDate);

        const [yearPart = "", monthPart = ""] =
          String(expenseDateKey).split("-");

        let key;

        if (analyticsGroupBy === "yearly") {
          key = yearPart;
        } else if (analyticsGroupBy === "monthly") {
          key = `${yearPart}-${monthPart}`;
        } else if (analyticsGroupBy === "weekly") {
          const date = new Date(expenseDate);
          const day = date.getDay();
          const offset = day === 0 ? 6 : day - 1;

          date.setDate(date.getDate() - offset);
          key = formatDateKey(date);
        } else {
          key = expenseDateKey;
        }

        accumulator[key] =
          (accumulator[key] || 0) + Number(expense.amount || 0);

        return accumulator;
      },
      {},
    );

    return Object.entries(groupedTrendMap)
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
          const endDay = new Date(
            Number(year),
            Number(month),
            0,
          ).getDate();

          return {
            ...point,
            dateKey: "",
            rangeFrom: `${year}-${month}-01`,
            rangeTo: `${year}-${month}-${String(endDay).padStart(2, "0")}`,
          };
        }

        return {
          ...point,
          dateKey: "",
          rangeFrom: `${bucketKey}-01-01`,
          rangeTo: `${bucketKey}-12-31`,
        };
      });
  }, [filteredExpenses, analyticsGroupBy]);

  const maxTrendValue = useMemo(() => {
    return trendData.reduce(
      (max, item) => Math.max(max, item.value),
      0,
    );
  }, [trendData]);

  return {
    monthSpent,
    latestExpenses,
    analyticsTotal,
    categoryTotals,
    trendData,
    maxTrendValue,
  };
}
