import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

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
    <section className="analytics-stack">
      <section className="panel-card">
        <div className="panel-head"><div><h3>Analytics</h3><p className="subtle">A first React analytics screen using your live expense data.</p></div></div>
        <div className="filter-stack">
          <div className="quick-filters">
            <button className={dateFilterMode === "allTime" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setDateFilterMode("allTime")}>All Time</button>
            <button className={dateFilterMode === "thisMonth" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setDateFilterMode("thisMonth")}>This Month</button>
            <button className={dateFilterMode === "lastMonth" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setDateFilterMode("lastMonth")}>Last Month</button>
            <button className={dateFilterMode === "thisYear" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setDateFilterMode("thisYear")}>This Year</button>
          </div>
          <div className="custom-filter-row">
            <label className="inline-field"><span>From</span><input type="date" value={customDateFrom} onChange={(event) => setCustomDateFrom(event.target.value)} /></label>
            <label className="inline-field"><span>To</span><input type="date" value={customDateTo} onChange={(event) => setCustomDateTo(event.target.value)} /></label>
            <button className="secondary-button" type="button" onClick={applyCustomDateRange}>Apply</button>
          </div>
        </div>
        <div className="stat-grid">
          <article className="stat-card"><span>Total Spending</span><strong>{formatCurrency(analyticsTotal)}</strong></article>
          <article className="stat-card"><span>Tracked Categories</span><strong>{Object.keys(categoryTotals).length}</strong></article>
          <article className="stat-card"><span>Visible Entries</span><strong>{analyticsExpenses.length}</strong></article>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="panel-card">
          <div className="panel-head"><div><h3>Trend</h3><p className="subtle">A lightweight chart grouped by time period.</p></div><div className="view-toggle"><button className={analyticsGroupBy === "daily" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setAnalyticsGroupBy("daily")}>Daily</button><button className={analyticsGroupBy === "monthly" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setAnalyticsGroupBy("monthly")}>Monthly</button><button className={analyticsGroupBy === "yearly" ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setAnalyticsGroupBy("yearly")}>Yearly</button></div></div>
          {trendData.length ? (
            <div className="trend-chart">
              {trendData.slice(-10).map((item) => (
                <div className="trend-bar-wrap" key={item.label}>
                  <div className="trend-value">{formatCurrency(item.value)}</div>
                  <div className="trend-bar" style={{ height: `${maxTrendValue ? (item.value / maxTrendValue) * 100 : 0}%` }} />
                  <div className="trend-label">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No analytics data available for the selected range.</div>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-head"><div><h3>Category Breakdown</h3><p className="subtle">Top categories by total spend.</p></div></div>
          {topCategories.length ? (
            <div className="category-list">
              {topCategories.map(([categoryKey, total]) => {
                const category = getCategoryDisplay(categoryKey);
                const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.uncategorized;
                const percent = analyticsTotal ? (total / analyticsTotal) * 100 : 0;
                return (
                  <div className="category-row" key={categoryKey}>
                    <div className="category-row-head"><div className="category-name"><span className="expense-dot" style={{ backgroundColor: color }} /><strong>{category.label}</strong></div><span>{formatCurrency(total)}</span></div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: color }} /></div>
                    <div className="category-meta">{percent.toFixed(1)}% of selected spending</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No category data available yet.</div>
          )}
        </section>
      </div>
    </section>
  );
}
