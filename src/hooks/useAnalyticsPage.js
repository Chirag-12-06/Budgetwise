import { useMemo, useState } from "react";
import { formatCurrency } from "../lib/api";
import { calculateCategoryPanelsHeight, createSeededRandom, isWithinOutlierBounds, clampNumber, getTextSafeBubbleDiameter } from "../utils/analytics";
import useTrendChart from "./useTrendChart";
import useBubbleBoardSize from "./useBubbleBoardSize";
import useBubbleVisibility from "./useBubbleVisibility";
import useOutlierFiltering from "./useOutlierFiltering";
import useBubbleLayout from "./useBubbleLayout";


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
  const isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
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
    chartCategories,
    summaryTotalSpending,
    outlierWarningText,
  } = useOutlierFiltering({
    trendPoints,
    analyticsExpenses,
    rawCategoryEntries,
    analyticsTotal,
  });
  const totalCategoryAmount = useMemo(
    () => chartCategories.reduce((sum, [, value]) => sum + value, 0),
    [chartCategories],
  );
  const {
    hiddenBubbleCategories,
    visibleCategories,
    toggleBubbleCategory,
  } = useBubbleVisibility(chartCategories);
  const { bubbleBoardSize, bubbleBoardRef } =
  useBubbleBoardSize(
    chartCategories.length,
  visibleCategories.length);
  const {
    bubblePanelHeight,
    bubbleLayout,
  } = useBubbleLayout({
    visibleCategories,
    totalCategoryAmount,
    bubbleBoardSize,
  });
const { lineCanvasRef } = useTrendChart({
  visibleTrendPoints,
  analyticsGroupBy,
  isDarkMode,
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
    bubbleBoardRef,
    isDarkMode,
    excludeOutliers,
    setExcludeOutliers,
    useLogScale,
    setUseLogScale,
    visibleTrendPoints,
    outlierWarningText,
    displayedAnalyticsExpenses,
    summaryTotalSpending,
    chartCategories,
    totalCategoryAmount,
    visibleCategories,
    bubblePanelHeight,
    bubbleLayout,
    hiddenBubbleCategories,
    toggleBubbleCategory,
    handleQuickDateMode,
    handleApplyDateRange,
  };
}
