import Button from "../components/button";
import ExpenseFilterPanel from "../components/expenseFilterPanel";
import PanelCard from "../components/panelCard";
import useAnalyticsPage from "../hooks/analytics/useAnalyticsPage";
import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(107, 114, 128, ${alpha})`;
  }

  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getContrastTextColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return "#ffffff";
  }

  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 160 ? "#111827" : "#ffffff";
}

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
  setAnalyticsGroupBy,
  trendData,
  categoryFilterExpenses,
  selectedCategoryFilters,
  onCategoryFilterToggle,
  onClearCategoryFilters,
}) {
  const {
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
    categoryEntries,
    totalCategoryAmount,
    visibleCategories,
    bubblePanelHeight,
    bubbleLayout,
    hiddenBubbleCategories,
    toggleBubbleCategory,
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

  return (
    <section className="grid gap-4">
      <PanelCard>
        <ExpenseFilterPanel
          className="grid gap-4"
          expenses={expenses}
          categoryFilterExpenses={categoryFilterExpenses}
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
          summaryTotalSpending={formatCurrency(summaryTotalSpending)}
          summaryTrackedCategories={categoryEntries.length}
          summaryVisibleEntries={displayedAnalyticsExpenses.length}
        />
      </PanelCard>

      <PanelCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <h3 className="text-xl font-bold whitespace-nowrap">{chartTitle}</h3>
          <div className="flex w-full flex-col items-end gap-1.5">
            <div className="inline-flex items-center rounded-xl border dark:border-gray-700 dark:bg-gray-900/40 p-1.5">
              {options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => setAnalyticsGroupBy(option.toLowerCase())}
                  className={`
                  relative px-4 py-2 text-sm font-medium transition-all duration-200
                  ${
                    analyticsGroupBy === option.toLowerCase()
                      ? "rounded-lg bg-indigo-600 dark:bg-slate-700 text-white shadow-sm"
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
        <PanelCard>
          {categoryEntries.length ? (
            <div className="pt-3">
              <div
                className="relative w-full overflow-hidden rounded-2xl"
                ref={bubbleBoardRef}
                style={{ height: `${bubblePanelHeight}px` }}
              >
                <div
                  className="pointer-events-none absolute left-4 top-3 text-sm font-semibold tracking-wide"
                  style={{ color: isDarkMode ? "#e5e7eb" : "#1f2937" }}
                >
                  Category Share
                </div>

                {visibleCategories.length ? (
                  bubbleLayout.map((bubble) => {
                    const categoryDisplay = getCategoryDisplay(
                      bubble.categoryKey,
                    );
                    const bubbleColor =
                      CATEGORY_COLORS[bubble.categoryKey] ||
                      CATEGORY_COLORS.uncategorized;
                    const textColor = getContrastTextColor(bubbleColor);
                    const badgeLabel = `${bubble.percent.toFixed(1)}%`;
                    const estimatedCharWidthRatio = 0.56;
                    const maxTextWidth = bubble.diameter * 0.78;
                    const estimatedFontSizePx = Math.floor(
                      maxTextWidth /
                        Math.max(
                          1,
                          badgeLabel.length * estimatedCharWidthRatio,
                        ),
                    );
                    const badgeFontSizePx = Math.max(
                      11,
                      Math.min(36, estimatedFontSizePx),
                    );

                    return (
                      <div
                        className="floating-bubble absolute flex items-center justify-center rounded-full text-center"
                        key={bubble.categoryKey}
                        style={{
                          left: `${Math.round(bubble.x)}px`,
                          top: `${Math.round(bubble.y)}px`,
                          width: `${Math.round(bubble.diameter)}px`,
                          height: `${Math.round(bubble.diameter)}px`,
                          backgroundColor: bubbleColor,
                          border: `2px solid ${hexToRgba(bubbleColor, 0.95)}`,
                          color: textColor,
                          animationDuration: `${bubble.animationDuration}s`,
                          animationDelay: `${bubble.animationDelay}s`,
                        }}
                        title={`${categoryDisplay.label}: ${formatCurrency(bubble.value)} (${bubble.percent.toFixed(1)}%)`}
                      >
                        <span
                          className="pointer-events-none inline-block max-w-full whitespace-nowrap font-bold leading-none"
                          style={{
                            fontSize: `${badgeFontSizePx}px`,
                            lineHeight: 1,
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                    All categories are hidden. Click a category in the legend to
                    show it again.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">
              No category data available for the selected range.
            </div>
          )}
        </PanelCard>

        <PanelCard>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Category Breakdown</h3>
            </div>
          </div>

          {categoryEntries.length ? (
            <div
              className="overflow-y-auto overscroll-y-contain pr-1 hide-scrollbar"
              style={{
                minHeight: `${bubblePanelHeight}px`,
                maxHeight: `${bubblePanelHeight}px`,
              }}
            >
              <div className="grid gap-3">
                {categoryEntries.map(([categoryKey, total]) => {
                  const category = getCategoryDisplay(categoryKey);
                  const color =
                    CATEGORY_COLORS[categoryKey] ||
                    CATEGORY_COLORS.uncategorized;
                  const percent = totalCategoryAmount
                    ? (total / totalCategoryAmount) * 100
                    : 0;
                  const isHidden = hiddenBubbleCategories.includes(categoryKey);

                  return (
                    <Button
                      variant="plain"
                      className={`grid gap-2 rounded-lg p-2 text-left transition-colors ${
                        isHidden
                          ? "opacity-45"
                          : "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      key={categoryKey}
                      type="button"
                      onClick={() => toggleBubbleCategory(categoryKey)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: color }}
                          >
                            <i className={category.icon} aria-hidden="true" />
                          </span>
                          <strong className="truncate">{category.label}</strong>
                        </div>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <div className="h-[0.7rem] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-[inherit]"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">
              No category data available yet.
            </div>
          )}
        </PanelCard>
      </div>
    </section>
  );
}
