import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";

export default function ExpensesPage({
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  filteredExpenses,
  loadingExpenses,
  emptyFilteredState,
  handleDeleteExpense,
}) {
  return (
    <section className="panel-card">
      <div className="panel-head"><div><h3>All Expenses</h3><p className="subtle">The first React version of your expense history screen.</p></div></div>
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

      {filteredExpenses.length ? (
        <div className="expense-list">
          {filteredExpenses.map((expense) => {
            const category = getCategoryDisplay(expense.category);
            const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;
            return (
              <article className="expense-item expense-item-detailed" key={expense.id}>
                <div className="expense-dot" style={{ backgroundColor: color }} />
                <div className="expense-copy"><strong>{expense.title}</strong><span>{category.label} • {new Date(expense.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span></div>
                <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                <div className="row-actions"><button className="icon-button danger" type="button" onClick={() => handleDeleteExpense(expense.id)}>Delete</button></div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">{loadingExpenses ? "Loading expenses..." : emptyFilteredState ? "No expenses in the selected date range." : "No expenses yet. Add your first one from the dashboard."}</div>
      )}
    </section>
  );
}
