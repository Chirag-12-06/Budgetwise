import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AnalyticsContext from "../context/AnalyticsContext";

import useExpenses from "../hooks/expenses/useExpenses";
import useExpenseAnalytics from "../hooks/analytics/useExpenseAnalytics";
import useOutlierFiltering from "../hooks/analytics/useOutlierFiltering";
import useTrendChart from "../hooks/analytics/useTrendChart";

import useBubbleVisibility from "../hooks/analytics/useBubbleVisibility";
import useBubbleBoardSize from "../hooks/analytics/useBubbleBoardSize";
import useBubbleLayout from "../hooks/analytics/useBubbleLayout";

const options = ["Daily", "Weekly", "Monthly", "Yearly"];

export default function AnalyticsProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [analyticsGroupBy, setAnalyticsGroupBy] = useState(
    searchParams.get("groupBy") || "daily",
  );

  const [useLogScale, setUseLogScale] = useState(false);

  function handleAnalyticsGroupByChange(value) {
    setAnalyticsGroupBy(value);

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("groupBy", value);
      return next;
    });
  }

  const {
    expenses,
    filteredExpenses,
    handleTrendPointDateSelect,
  } = useExpenses();

  const {
    analyticsTotal,
    categoryTotals,
    trendData,
  } = useExpenseAnalytics({
    expenses,
    filteredExpenses,
    analyticsGroupBy,
  });

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
        .filter(
          (point) =>
            Number.isFinite(point.value) && point.value >= 0,
        ),
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
    categoryEntries,
    outlierWarningText,
  } = useOutlierFiltering({
    trendPoints,
    analyticsExpenses: filteredExpenses,
    rawCategoryEntries,
    analyticsTotal,
  });

  const { lineCanvasRef, chartTitle } = useTrendChart({
    visibleTrendPoints,
    analyticsGroupBy,
    useLogScale,
    onTrendPointSelect: handleTrendPointDateSelect,
  });

  const {
    hiddenBubbleCategories,
    visibleCategories,
    toggleBubbleCategory,
  } = useBubbleVisibility(categoryEntries);

  const { bubbleBoardRef, bubbleBoardSize } = useBubbleBoardSize();

  const {
    bubblePanelHeight,
    bubbleLayout,
    totalCategoryAmount,
  } = useBubbleLayout({
    visibleCategories,
    bubbleBoardSize,
    categoryEntries,
  });


  const value = {
    chartTitle,
    options,
    analyticsGroupBy,
    handleAnalyticsGroupByChange,
    excludeOutliers,
    setExcludeOutliers,
    useLogScale,
    setUseLogScale,
    outlierWarningText,
    visibleTrendPoints,
    lineCanvasRef,
    categoryEntries,
    visibleCategories,
    bubbleBoardRef,
    bubblePanelHeight,
    bubbleLayout,
    hiddenBubbleCategories,
    toggleBubbleCategory,
    
    totalCategoryAmount,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}