import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

const panelCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";
const baseTabClasses =
  "rounded-md px-4 py-2 text-sm font-medium transition-colors";
const activeTabClasses = "bg-indigo-600 text-white";
const inactiveTabClasses = "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";
const inputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

export default function AnalyticsPage({
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  analyticsTotal,
  categoryTotals,
  analyticsExpenses,
  analyticsGroupBy,
  setAnalyticsGroupBy,
  trendData,
  maxTrendValue,
  topCategories,
}) {
  return (
    <section className="grid gap-4">
      <section className={panelCardClasses}>
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
        </div>
        <div className="mb-5 grid gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              className={`${baseTabClasses} ${dateFilterMode === "allTime" ? activeTabClasses : inactiveTabClasses}`}
              type="button"
              onClick={() => setDateFilterMode("allTime")}
            >
              All Time
            </button>
            <button
              className={`${baseTabClasses} ${dateFilterMode === "thisMonth" ? activeTabClasses : inactiveTabClasses}`}
              type="button"
              onClick={() => setDateFilterMode("thisMonth")}
            >
              This Month
            </button>
            <button
              className={`${baseTabClasses} ${dateFilterMode === "lastMonth" ? activeTabClasses : inactiveTabClasses}`}
              type="button"
              onClick={() => setDateFilterMode("lastMonth")}
            >
              Last Month
            </button>
            <button
              className={`${baseTabClasses} ${dateFilterMode === "thisYear" ? activeTabClasses : inactiveTabClasses}`}
              type="button"
              onClick={() => setDateFilterMode("thisYear")}
            >
              This Year
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">From</span>
              <input
                className={inputClasses}
                type="date"
                value={customDateFrom}
                onChange={(event) => setCustomDateFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold">To</span>
              <input
                className={inputClasses}
                type="date"
                value={customDateTo}
                onChange={(event) => setCustomDateTo(event.target.value)}
              />
            </label>
            <button
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              type="button"
              onClick={applyCustomDateRange}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className={panelCardClasses}>
            <span className="mb-2 block text-gray-500 dark:text-gray-300">Total Spending</span>
            <strong className="text-[1.3rem]">{formatCurrency(analyticsTotal)}</strong>
          </article>
          <article className={panelCardClasses}>
            <span className="mb-2 block text-gray-500 dark:text-gray-300">Tracked Categories</span>
            <strong className="text-[1.3rem]">{Object.keys(categoryTotals).length}</strong>
          </article>
          <article className={panelCardClasses}>
            <span className="mb-2 block text-gray-500 dark:text-gray-300">Visible Entries</span>
            <strong className="text-[1.3rem]">{analyticsExpenses.length}</strong>
          </article>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Trend</h3>
              <p className="text-gray-500 dark:text-gray-300">
                A lightweight chart grouped by time period.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`${baseTabClasses} ${analyticsGroupBy === "daily" ? activeTabClasses : inactiveTabClasses}`}
                type="button"
                onClick={() => setAnalyticsGroupBy("daily")}
              >
                Daily
              </button>
              <button
                className={`${baseTabClasses} ${analyticsGroupBy === "monthly" ? activeTabClasses : inactiveTabClasses}`}
                type="button"
                onClick={() => setAnalyticsGroupBy("monthly")}
              >
                Monthly
              </button>
              <button
                className={`${baseTabClasses} ${analyticsGroupBy === "yearly" ? activeTabClasses : inactiveTabClasses}`}
                type="button"
                onClick={() => setAnalyticsGroupBy("yearly")}
              >
                Yearly
              </button>
            </div>
          </div>
          {trendData.length ? (
            <div className="grid min-h-[22rem] auto-rows-auto grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] items-end gap-3.5 pt-4">
              {trendData.slice(-10).map((item) => (
                <div className="grid min-h-[20rem] grid-rows-[auto_1fr_auto] items-end gap-2" key={item.label}>
                  <div className="text-[0.82rem] text-gray-500 dark:text-gray-300">
                    {formatCurrency(item.value)}
                  </div>
                  <div
                    className="w-full min-h-3 rounded-t-[18px] rounded-b-[8px] bg-[linear-gradient(180deg,#2563eb_0%,#0f766e_100%)]"
                    style={{ height: `${maxTrendValue ? (item.value / maxTrendValue) * 100 : 0}%` }}
                  />
                  <div className="text-[0.82rem] text-gray-500 dark:text-gray-300">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">
              No analytics data available for the selected range.
            </div>
          )}
        </section>

        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Category Breakdown</h3>
              <p className="text-gray-500 dark:text-gray-300">Top categories by total spend.</p>
            </div>
          </div>
          {topCategories.length ? (
            <div className="grid gap-4">
              {topCategories.map(([categoryKey, total]) => {
                const category = getCategoryDisplay(categoryKey);
                const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.uncategorized;
                const percent = analyticsTotal ? (total / analyticsTotal) * 100 : 0;
                return (
                  <div className="grid gap-2" key={categoryKey}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center justify-start gap-3">
                        <span
                          className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_6px_rgba(148,163,184,0.1)]"
                          style={{ backgroundColor: color }}
                        />
                        <strong>{category.label}</strong>
                      </div>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="h-[0.7rem] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-[inherit]"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="text-[0.82rem] text-gray-500 dark:text-gray-300">
                      {percent.toFixed(1)}% of selected spending
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">No category data available yet.</div>
          )}
        </section>
      </div>
    </section>
  );
}
