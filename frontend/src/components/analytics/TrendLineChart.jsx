import { PanelCard, DateFilterSelector } from "../ui";
import useAnalytics from "../../hooks/analytics/useAnalytics";

export default function TrendChart() {
  const {
    analyticsGroupBy,
    handleAnalyticsGroupByChange,
    excludeOutliers,
    setExcludeOutliers,
    useLogScale,
    setUseLogScale,
    outlierWarningText,
    visibleTrendPoints,
    lineCanvasRef,
  } = useAnalytics();

  const options = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  const chartTitle =
    ` ${options[analyticsGroupBy]} Expense Trend` || "Expense Trend";

  return (
    <PanelCard>
      <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-bold whitespace-nowrap">{chartTitle}</h3>

        <div className="flex w-full flex-col items-end gap-1.5">
          <DateFilterSelector
            options={Object.entries(options).map(([value, label]) => ({
              value,
              label,
            }))}
            value={analyticsGroupBy}
            onChange={handleAnalyticsGroupByChange}
          />

          <div className="flex flex-wrap items-center rounded-xl border dark:border-gray-700 dark:bg-gray-900/40 p-1.5">
            <label className="flex cursor-pointer items-center gap-2 px-3 text-sm font-medium dark:text-gray-300">
              <input
                type="checkbox"
                checked={excludeOutliers}
                onChange={(e) => setExcludeOutliers(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Exclude Outliers
            </label>

            <label className="flex cursor-pointer items-center gap-2 border-l dark:border-gray-600 px-3 text-sm font-medium dark:text-gray-300">
              <input
                type="checkbox"
                checked={useLogScale}
                onChange={(e) => setUseLogScale(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Log Scale
            </label>
          </div>
        </div>
      </div>

      {outlierWarningText ? (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/25">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            Outliers Detected
          </h4>

          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            {outlierWarningText}
          </p>

          <p className="mt-2 text-xs text-yellow-700/90 dark:text-yellow-500">
            Tip: Enable Exclude Outliers or Log Scale for better visualization.
          </p>
        </div>
      ) : null}

      {visibleTrendPoints.length ? (
        <div className="h-96 pt-4">
          <canvas ref={lineCanvasRef} />
        </div>
      ) : (
        <div className="py-6 text-gray-500 dark:text-gray-300">
          No analytics data available for the selected range.
        </div>
      )}
    </PanelCard>
  );
}
