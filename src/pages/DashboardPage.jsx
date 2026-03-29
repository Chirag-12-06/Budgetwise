import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, CATEGORY_OPTIONS, getCategoryDisplay } from "../lib/categoryConfig";

export default function DashboardPage({
  totalSpent,
  monthSpent,
  expenses,
  latestExpenses,
  loadingExpenses,
  expenseForm,
  setExpenseForm,
  handleAddExpense,
  submitting,
}) {
  return (
    <>
      <div className="stat-grid">
        <article className="stat-card"><span>Total Expenses</span><strong>{formatCurrency(totalSpent)}</strong></article>
        <article className="stat-card"><span>This Month</span><strong>{formatCurrency(monthSpent)}</strong></article>
        <article className="stat-card"><span>Total Entries</span><strong>{expenses.length}</strong></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel-card">
          <div className="panel-head"><div><h3>Add Expense</h3><p className="subtle">This is the first live form migrated from the vanilla app.</p></div></div>
          <form className="auth-form" onSubmit={handleAddExpense}>
            <label><span>Title</span><input type="text" value={expenseForm.title} onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))} required placeholder="Dinner with friends" /></label>
            <label><span>Amount</span><input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} required placeholder="450" /></label>
            <label><span>Category</span><select value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}>{CATEGORY_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}</select></label>
            <label><span>Date</span><input type="date" value={expenseForm.date} onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))} /></label>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Expense"}</button>
          </form>
        </section>

        <section className="panel-card">
          <div className="panel-head"><div><h3>Recent Expenses</h3><p className="subtle">{loadingExpenses ? "Loading from your backend..." : "Latest entries from your account."}</p></div></div>
          {latestExpenses.length ? (
            <div className="expense-list">
              {latestExpenses.map((expense) => {
                const category = getCategoryDisplay(expense.category);
                const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;
                return (
                  <article className="expense-item" key={expense.id}>
                    <div className="expense-dot" style={{ backgroundColor: color }} />
                    <div className="expense-copy"><strong>{expense.title}</strong><span>{category.label} • {new Date(expense.createdAt).toLocaleDateString("en-IN")}</span></div>
                    <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">{loadingExpenses ? "Loading expenses..." : "No expenses yet. Add your first one here."}</div>
          )}
        </section>
      </div>
    </>
  );
}
