import { useMemo, useState } from "react";
import { formatCurrency } from "../../lib/api";
import { detectOutliers, isWithinOutlierBounds } from "../../utils/analytics";

export default function useOutlierFiltering({
  trendPoints,
  analyticsExpenses,
  rawCategoryEntries,
  analyticsTotal,
}) {
  const [excludeOutliers, setExcludeOutliers] = useState(false);

  const trendOutlierInfo = useMemo(
    () => detectOutliers(trendPoints.map((point) => point.value)),
    [trendPoints],
  );

  const visibleTrendPoints = useMemo(() => {
    if (!excludeOutliers || !trendOutlierInfo.hasOutliers) {
      return trendPoints;
    }

    return trendPoints.filter((point) =>
      isWithinOutlierBounds(point.value, trendOutlierInfo),
    );
  }, [trendPoints, excludeOutliers, trendOutlierInfo]);

  const expenseAmountOutlierInfo = useMemo(
    () =>
      detectOutliers(
        analyticsExpenses.map((expense) => Number(expense.amount || 0)),
      ),
    [analyticsExpenses],
  );

  const displayedAnalyticsExpenses = useMemo(() => {
    if (!excludeOutliers || !expenseAmountOutlierInfo.hasOutliers) {
      return analyticsExpenses;
    }

    return analyticsExpenses.filter((expense) => {
      const amount = Number(expense.amount || 0);

      return isWithinOutlierBounds(amount, expenseAmountOutlierInfo);
    });
  }, [analyticsExpenses, excludeOutliers, expenseAmountOutlierInfo]);

  const categoryOutlierInfo = useMemo(
    () => detectOutliers(rawCategoryEntries.map(([, value]) => value)),
    [rawCategoryEntries],
  );

  const categoryEntries = useMemo(() => {
    if (
      excludeOutliers &&
      rawCategoryEntries.length >= 3 &&
      categoryOutlierInfo.hasOutliers
    ) {
      const upperBound = Number(categoryOutlierInfo.upperBound);

      if (!Number.isFinite(upperBound)) {
        return rawCategoryEntries;
      }

      const highestCategoryValue = Number(rawCategoryEntries[0]?.[1] || 0);

      const secondHighestCategoryValue = Number(
        rawCategoryEntries[1]?.[1] || 0,
      );

      const extremeHighCutoff = Math.max(
        upperBound * 2,
        secondHighestCategoryValue > 0
          ? secondHighestCategoryValue * 4
          : upperBound * 2,
      );

      if (highestCategoryValue <= extremeHighCutoff) {
        return rawCategoryEntries;
      }

      return rawCategoryEntries.filter(
        ([, value]) => Number(value) <= extremeHighCutoff,
      );
    }

    return rawCategoryEntries;
  }, [rawCategoryEntries, excludeOutliers, categoryOutlierInfo]);

  const displayedAnalyticsTotal = useMemo(
    () =>
      displayedAnalyticsExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0,
      ),
    [displayedAnalyticsExpenses],
  );

  const summaryTotalSpending = useMemo(
    () => (excludeOutliers ? displayedAnalyticsTotal : analyticsTotal),
    [excludeOutliers, displayedAnalyticsTotal, analyticsTotal],
  );

  const outlierWarningText = useMemo(() => {
    if (
      excludeOutliers ||
      !trendOutlierInfo.hasOutliers ||
      !trendPoints.length
    ) {
      return "";
    }

    const maxOutlier = Math.max(...trendOutlierInfo.outliers);

    const count = trendOutlierInfo.outliers.length;

    return `Found ${count} outlier value${
      count > 1 ? "s" : ""
    } out of ${trendPoints.length} data points. Highest outlier: ${formatCurrency(maxOutlier)}. This may affect chart readability.`;
  }, [excludeOutliers, trendOutlierInfo, trendPoints]);

  return {
    excludeOutliers,
    setExcludeOutliers,
    visibleTrendPoints,
    displayedAnalyticsExpenses,
    categoryEntries,
    summaryTotalSpending,
    outlierWarningText,
  };
}
