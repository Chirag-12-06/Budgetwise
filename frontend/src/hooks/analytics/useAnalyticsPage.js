import { useMemo, useState } from "react";
import useOutlierFiltering from "./useOutlierFiltering";
import useTrendChart from "./useTrendChart";

export default function useAnalyticsPage({
  trendData,
  analyticsExpenses,
  categoryTotals,
  analyticsGroupBy,
  analyticsTotal,
  setDateFilterMode,
  applyCustomDateRange,
  onTrendPointSelect,
}) {
  const [useLogScale, setUseLogScale] = useState(false);
  const trendPoints = useMemo(
    () =>
      (trendData || [])
        .map((point) => ({
          bucketKey: point.bucketKey,
          label: point.label,
          value: Number(point.value || 0),
          dateKey: point.dateKey || "",
          rangeFrom: point.rangeFrom || "",
          rangeTo: point.rangeTo || "",
        }))
        .filter((point) => Number.isFinite(point.value) && point.value >= 0),
    [trendData],
  );
  const rawCategoryEntries = useMemo(
    () =>
      Object.entries(categoryTotals || {})
        .map(([key, value]) => [key, Number(value || 0)])
        .filter(([, value]) => value > 0)
        .sort((left, right) => right[1] - left[1]),
    [categoryTotals],
  );
  const {
    excludeOutliers,
    setExcludeOutliers,
    visibleTrendPoints,
    displayedAnalyticsExpenses,
    categoryEntries,
    summaryTotalSpending,
    outlierWarningText,
  } = useOutlierFiltering({
    trendPoints,
    analyticsExpenses,
    rawCategoryEntries,
    analyticsTotal,
  });
  const { lineCanvasRef, chartTitle } = useTrendChart({
    visibleTrendPoints,
    analyticsGroupBy,
    useLogScale,
    onTrendPointSelect,
  });

  function resetChartOptions() {
    setExcludeOutliers(false);
    setUseLogScale(false);
  }

  function handleQuickDateMode(mode) {
    resetChartOptions();
    setDateFilterMode(mode);
  }

  function handleApplyDateRange() {
    resetChartOptions();
    applyCustomDateRange();
  }

  return {
    lineCanvasRef,
    excludeOutliers,
    setExcludeOutliers,
    useLogScale,
    setUseLogScale,
    visibleTrendPoints,
    outlierWarningText,
    displayedAnalyticsExpenses,
    summaryTotalSpending,
    categoryEntries,
    handleQuickDateMode,
    handleApplyDateRange,
    chartTitle,
  };
}
