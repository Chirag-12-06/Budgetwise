import ExpenseFilterPanel from "../components/expenseFilterPanel";
import PanelCard from "../components/ui/PanelCard";
import useAnalyticsPage from "../hooks/analytics/useAnalyticsPage";
import { formatCurrency } from "../utils/currency";
import useCategory from "../hooks/useCategory";
import usePreferences from "../hooks/profile/usePreferences";
import {
  CategoryBubbleChart,
  CategoryBreakdown,
} from "../components/analytics";

export default function AnalyticsPage({
  expenses,
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  onTrendPointDateSelect,
  dateRangeError,
  analyticsTotal,
  categoryTotals,
  analyticsExpenses,
  analyticsGroupBy,
  handleAnalyticsGroupByChange,
  trendData,
  selectedCategoryFilters,
  onCategoryFilterToggle,
  onClearCategoryFilters,
}) {
  const {
    lineCanvasRef,
    isDarkMode,
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
  } = useAnalyticsPage({
    trendData,
    analyticsExpenses,
    categoryTotals,
    analyticsGroupBy,
    analyticsTotal,
    setDateFilterMode,
    applyCustomDateRange,
    onTrendPointSelect: onTrendPointDateSelect,
  });
  const options = ["Daily", "Weekly", "Monthly", "Yearly"];
  const { categories } = useCategory();
  const { preferences } = usePreferences();
  const reportingCurrency = preferences?.reportingCurrency || "INR";
  return (
    <section className="grid gap-4">
      <PanelCard>
        <ExpenseFilterPanel
          className="grid gap-4"
          expenses={expenses}
          dateFilterMode={dateFilterMode}
          onDateFilterModeChange={handleQuickDateMode}
          customDateFrom={customDateFrom}
          onCustomDateFromChange={setCustomDateFrom}
          customDateTo={customDateTo}
          onCustomDateToChange={setCustomDateTo}
          onApplyDateRange={handleApplyDateRange}
          dateRangeError={dateRangeError}
          selectedCategoryFilters={selectedCategoryFilters}
          onCategoryFilterToggle={onCategoryFilterToggle}
          onClearCategoryFilters={onClearCategoryFilters}
          summaryExpenses={displayedAnalyticsExpenses}
          summaryTotalSpending={formatCurrency(
            summaryTotalSpending,
            reportingCurrency,
          )}
          summaryTrackedCategories={categoryEntries.length}
          summaryVisibleEntries={displayedAnalyticsExpenses.length}
        />
      </PanelCard>

      <PanelCard>
        <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:justify-between">
          <h3 className="text-xl font-bold whitespace-nowrap">{chartTitle}</h3>
          <div className="flex w-full flex-col items-end gap-1.5">
            <div className="inline-flex items-center rounded-xl border dark:border-gray-700 dark:bg-gray-900/40 p-1.5">
              {options.map((option, index) => (
                <button
                  key={option}
                  onClick={() =>
                    handleAnalyticsGroupByChange(option.toLowerCase())
                  }
                  className={`
                  relative px-4 py-2 text-sm font-medium transition-all duration-200
                  ${
                    analyticsGroupBy === option.toLowerCase()
                      ? "rounded-lg bg-indigo-600 text-white shadow-sm"
                      : "dark:text-gray-300 dark:hover:text-white"
                  }
                `}
                >
                  {option}
                  {index !== options.length - 1 &&
                    analyticsGroupBy !== option.toLowerCase() &&
                    analyticsGroupBy !== options[index + 1].toLowerCase() && (
                      <span className="absolute right-0 top-1/2 h-4 -translate-y-1/2 border-r dark:border-gray-600" />
                    )}
                </button>
              ))}
            </div>
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
              Tip: Enable Exclude Outliers or Log Scale for better
              visualization.
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

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryBubbleChart
            categoryEntries={categoryEntries}
            categories={categories}
            isDarkMode={isDarkMode}
            reportingCurrency={reportingCurrency}
          />

          <CategoryBreakdown
            categoryEntries={categoryEntries}
            categories={categories}
            reportingCurrency={reportingCurrency}
          />
        </div>
      </div>
    </section>
  );
}
