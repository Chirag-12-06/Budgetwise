import { useEffect, useState } from "react";
import {
  createExpense,
  fetchExpenses,
  formatCurrency,
  getTodayDate,
  removeExpense,
} from "./lib/api";
import {
  getStoredUser,
  hasToken,
  loginUser,
  logoutUser,
  signupUser,
} from "./lib/auth";
import { CATEGORY_COLORS, CATEGORY_OPTIONS, getCategoryDisplay } from "./lib/categoryConfig";

const LOGIN = "login";
const SIGNUP = "signup";
const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

function App() {
  const [mode, setMode] = useState(LOGIN);
  const [view, setView] = useState(DASHBOARD);
  const [dark, setDark] = useState(() => localStorage.getItem("bw-dark") === "1");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState("allTime");
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState("daily");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [user, setUser] = useState(() => (hasToken() ? getStoredUser() : null));
  const [expenses, setExpenses] = useState([]);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "dining",
    date: getTodayDate(),
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bw-dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    let ignore = false;

    async function loadExpenses() {
      setLoadingExpenses(true);
      try {
        const data = await fetchExpenses();
        if (!ignore) {
          setExpenses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          showStatus(error.message || "Unable to load expenses", "error");
        }
      } finally {
        if (!ignore) {
          setLoadingExpenses(false);
        }
      }
    }

    loadExpenses();
    return () => {
      ignore = true;
    };
  }, [user]);

  function showStatus(message, type) {
    setStatus({ message, type });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const data = await loginUser(loginForm);
      setUser(data.user);
      setView(DASHBOARD);
      showStatus("Login successful. Your React dashboard is ready.", "success");
    } catch (error) {
      showStatus(error.message || "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setStatus(null);

    if (signupForm.password !== signupForm.confirmPassword) {
      showStatus("Passwords do not match", "error");
      return;
    }

    setSubmitting(true);

    try {
      const data = await signupUser(signupForm);
      setUser(data.user);
      setView(DASHBOARD);
      showStatus("Account created successfully. Your React dashboard is ready.", "success");
    } catch (error) {
      showStatus(error.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddExpense(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const created = await createExpense({
        title: expenseForm.title.trim(),
        amount: expenseForm.amount,
        category: expenseForm.category,
        date: expenseForm.date,
      });

      setExpenses((current) =>
        [created, ...current].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      );
      setExpenseForm((current) => ({
        ...current,
        title: "",
        amount: "",
        date: getTodayDate(),
      }));
      showStatus("Expense added successfully", "success");
    } catch (error) {
      showStatus(error.message || "Unable to add expense", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) {
      return;
    }

    try {
      await removeExpense(id);
      setExpenses((current) => current.filter((expense) => expense.id !== id));
      showStatus("Expense deleted successfully", "success");
    } catch (error) {
      showStatus(error.message || "Failed to delete expense", "error");
    }
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setExpenses([]);
    setLoginForm({ email: "", password: "" });
    setSignupForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setExpenseForm({
      title: "",
      amount: "",
      category: "dining",
      date: getTodayDate(),
    });
    setView(DASHBOARD);
    setDateFilterMode("allTime");
    setCustomDateFrom("");
    setCustomDateTo("");
    setMode(LOGIN);
    showStatus("Logged out", "success");
  }

  function applyDateFilter(list) {
    if (dateFilterMode === "allTime") {
      return list;
    }

    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateFilterMode === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilterMode === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateFilterMode === "thisYear") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateFilterMode === "custom") {
      if (customDateFrom) {
        startDate = new Date(customDateFrom);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customDateTo) {
        endDate = new Date(customDateTo);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    return list.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;
      return true;
    });
  }

  function applyCustomDateRange() {
    if (!customDateFrom && !customDateTo) {
      showStatus("Choose at least one date to apply a custom range", "error");
      return;
    }

    if (customDateFrom && customDateTo && new Date(customDateFrom) > new Date(customDateTo)) {
      showStatus("From date cannot be later than To date", "error");
      return;
    }

    setDateFilterMode("custom");
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const monthSpent = expenses
    .filter((expense) => {
      const created = new Date(expense.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const latestExpenses = [...expenses]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);
  const filteredExpenses = applyDateFilter(
    [...expenses].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  );
  const emptyFilteredState = filteredExpenses.length === 0 && expenses.length > 0;
  const analyticsExpenses = filteredExpenses;
  const analyticsTotal = analyticsExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const categoryTotals = analyticsExpenses.reduce((accumulator, expense) => {
    const key = expense.category || "uncategorized";
    accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  const groupedTrendMap = analyticsExpenses.reduce((accumulator, expense) => {
    const expenseDate = new Date(expense.createdAt);
    let key;

    if (analyticsGroupBy === "monthly") {
      key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
    } else if (analyticsGroupBy === "yearly") {
      key = `${expenseDate.getFullYear()}`;
    } else {
      key = expenseDate.toISOString().split("T")[0];
    }

    accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});

  const trendData = Object.entries(groupedTrendMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }));

  const maxTrendValue = trendData.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );

  return (
    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>
      <button className="theme-toggle" type="button" onClick={() => setDark((value) => !value)}>
        {dark ? "Light" : "Dark"}
      </button>

      <main className="auth-page">
        <section className={user ? "auth-card auth-card-wide" : "auth-card"}>
          <header className="auth-header">
            <p className="eyebrow">Budgetwise React</p>
            <h1>{user ? "Dashboard Migration" : "Start the migration without breaking the working app."}</h1>
            <p className="subtle">
              {user
                ? "This first React slice uses your real backend for auth and expenses."
                : "This React shell currently handles authentication and stores the same auth keys as the existing frontend."}
            </p>
          </header>

          {user ? (
            <section className="dashboard-panel">
              <div className="dashboard-head">
                <div>
                  <p className="welcome-label">Welcome back</p>
                  <h2>{user.name || user.email || "Budgetwise user"}</h2>
                  <p className="subtle">The app now has a basic dashboard view and a dedicated expenses view.</p>
                </div>
                <div className="nav-actions">
                  <div className="view-toggle" role="tablist" aria-label="App view">
                    <button
                      className={view === DASHBOARD ? "mini-tab active" : "mini-tab"}
                      type="button"
                      onClick={() => setView(DASHBOARD)}
                    >
                      Dashboard
                    </button>
                    <button
                      className={view === EXPENSES ? "mini-tab active" : "mini-tab"}
                      type="button"
                      onClick={() => setView(EXPENSES)}
                    >
                      Expenses
                    </button>
                    <button
                      className={view === ANALYTICS ? "mini-tab active" : "mini-tab"}
                      type="button"
                      onClick={() => setView(ANALYTICS)}
                    >
                      Analytics
                    </button>
                  </div>
                  <button className="secondary-button" type="button" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </div>

              {view === DASHBOARD ? (
                <>
                  <div className="stat-grid">
                    <article className="stat-card">
                      <span>Total Expenses</span>
                      <strong>{formatCurrency(totalSpent)}</strong>
                    </article>
                    <article className="stat-card">
                      <span>This Month</span>
                      <strong>{formatCurrency(monthSpent)}</strong>
                    </article>
                    <article className="stat-card">
                      <span>Total Entries</span>
                      <strong>{expenses.length}</strong>
                    </article>
                  </div>

                  <div className="dashboard-grid">
                    <section className="panel-card">
                      <div className="panel-head">
                        <div>
                          <h3>Add Expense</h3>
                          <p className="subtle">This is the first live form migrated from the vanilla app.</p>
                        </div>
                      </div>

                      <form className="auth-form" onSubmit={handleAddExpense}>
                        <label>
                          <span>Title</span>
                          <input
                            type="text"
                            value={expenseForm.title}
                            onChange={(event) =>
                              setExpenseForm((current) => ({ ...current, title: event.target.value }))
                            }
                            required
                            placeholder="Dinner with friends"
                          />
                        </label>

                        <label>
                          <span>Amount</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={(event) =>
                              setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                            }
                            required
                            placeholder="450"
                          />
                        </label>

                        <label>
                          <span>Category</span>
                          <select
                            value={expenseForm.category}
                            onChange={(event) =>
                              setExpenseForm((current) => ({ ...current, category: event.target.value }))
                            }
                          >
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Date</span>
                          <input
                            type="date"
                            value={expenseForm.date}
                            onChange={(event) =>
                              setExpenseForm((current) => ({ ...current, date: event.target.value }))
                            }
                          />
                        </label>

                        <button className="primary-button" type="submit" disabled={submitting}>
                          {submitting ? "Saving..." : "Add Expense"}
                        </button>
                      </form>
                    </section>

                    <section className="panel-card">
                      <div className="panel-head">
                        <div>
                          <h3>Recent Expenses</h3>
                          <p className="subtle">
                            {loadingExpenses ? "Loading from your backend..." : "Latest entries from your account."}
                          </p>
                        </div>
                      </div>

                      {latestExpenses.length ? (
                        <div className="expense-list">
                          {latestExpenses.map((expense) => {
                            const category = getCategoryDisplay(expense.category);
                            const color =
                              CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;

                            return (
                              <article className="expense-item" key={expense.id}>
                                <div className="expense-dot" style={{ backgroundColor: color }} />
                                <div className="expense-copy">
                                  <strong>{expense.title}</strong>
                                  <span>
                                    {category.label} •{" "}
                                    {new Date(expense.createdAt).toLocaleDateString("en-IN")}
                                  </span>
                                </div>
                                <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state">
                          {loadingExpenses ? "Loading expenses..." : "No expenses yet. Add your first one here."}
                        </div>
                      )}
                    </section>
                  </div>
                </>
              ) : view === EXPENSES ? (
                <section className="panel-card">
                  <div className="panel-head">
                    <div>
                      <h3>All Expenses</h3>
                      <p className="subtle">The first React version of your expense history screen.</p>
                    </div>
                  </div>

                  <div className="filter-stack">
                    <div className="quick-filters">
                      <button
                        className={dateFilterMode === "allTime" ? "mini-tab active" : "mini-tab"}
                        type="button"
                        onClick={() => setDateFilterMode("allTime")}
                      >
                        All Time
                      </button>
                      <button
                        className={dateFilterMode === "thisMonth" ? "mini-tab active" : "mini-tab"}
                        type="button"
                        onClick={() => setDateFilterMode("thisMonth")}
                      >
                        This Month
                      </button>
                      <button
                        className={dateFilterMode === "lastMonth" ? "mini-tab active" : "mini-tab"}
                        type="button"
                        onClick={() => setDateFilterMode("lastMonth")}
                      >
                        Last Month
                      </button>
                      <button
                        className={dateFilterMode === "thisYear" ? "mini-tab active" : "mini-tab"}
                        type="button"
                        onClick={() => setDateFilterMode("thisYear")}
                      >
                        This Year
                      </button>
                    </div>

                    <div className="custom-filter-row">
                      <label className="inline-field">
                        <span>From</span>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(event) => setCustomDateFrom(event.target.value)}
                        />
                      </label>
                      <label className="inline-field">
                        <span>To</span>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(event) => setCustomDateTo(event.target.value)}
                        />
                      </label>
                      <button className="secondary-button" type="button" onClick={applyCustomDateRange}>
                        Apply
                      </button>
                    </div>
                  </div>

                  {filteredExpenses.length ? (
                    <div className="expense-list">
                      {filteredExpenses.map((expense) => {
                        const category = getCategoryDisplay(expense.category);
                        const color =
                          CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.uncategorized;

                        return (
                          <article className="expense-item expense-item-detailed" key={expense.id}>
                            <div className="expense-dot" style={{ backgroundColor: color }} />
                            <div className="expense-copy">
                              <strong>{expense.title}</strong>
                              <span>
                                {category.label} •{" "}
                                {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                            <div className="row-actions">
                              <button
                                className="icon-button danger"
                                type="button"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      {loadingExpenses
                        ? "Loading expenses..."
                        : emptyFilteredState
                          ? "No expenses in the selected date range."
                          : "No expenses yet. Add your first one from the dashboard."}
                    </div>
                  )}
                </section>
              ) : (
                <section className="analytics-stack">
                  <section className="panel-card">
                    <div className="panel-head">
                      <div>
                        <h3>Analytics</h3>
                        <p className="subtle">A first React analytics screen using your live expense data.</p>
                      </div>
                    </div>

                    <div className="filter-stack">
                      <div className="quick-filters">
                        <button
                          className={dateFilterMode === "allTime" ? "mini-tab active" : "mini-tab"}
                          type="button"
                          onClick={() => setDateFilterMode("allTime")}
                        >
                          All Time
                        </button>
                        <button
                          className={dateFilterMode === "thisMonth" ? "mini-tab active" : "mini-tab"}
                          type="button"
                          onClick={() => setDateFilterMode("thisMonth")}
                        >
                          This Month
                        </button>
                        <button
                          className={dateFilterMode === "lastMonth" ? "mini-tab active" : "mini-tab"}
                          type="button"
                          onClick={() => setDateFilterMode("lastMonth")}
                        >
                          Last Month
                        </button>
                        <button
                          className={dateFilterMode === "thisYear" ? "mini-tab active" : "mini-tab"}
                          type="button"
                          onClick={() => setDateFilterMode("thisYear")}
                        >
                          This Year
                        </button>
                      </div>

                      <div className="custom-filter-row">
                        <label className="inline-field">
                          <span>From</span>
                          <input
                            type="date"
                            value={customDateFrom}
                            onChange={(event) => setCustomDateFrom(event.target.value)}
                          />
                        </label>
                        <label className="inline-field">
                          <span>To</span>
                          <input
                            type="date"
                            value={customDateTo}
                            onChange={(event) => setCustomDateTo(event.target.value)}
                          />
                        </label>
                        <button className="secondary-button" type="button" onClick={applyCustomDateRange}>
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="stat-grid">
                      <article className="stat-card">
                        <span>Total Spending</span>
                        <strong>{formatCurrency(analyticsTotal)}</strong>
                      </article>
                      <article className="stat-card">
                        <span>Tracked Categories</span>
                        <strong>{Object.keys(categoryTotals).length}</strong>
                      </article>
                      <article className="stat-card">
                        <span>Visible Entries</span>
                        <strong>{analyticsExpenses.length}</strong>
                      </article>
                    </div>
                  </section>

                  <div className="analytics-grid">
                    <section className="panel-card">
                      <div className="panel-head">
                        <div>
                          <h3>Trend</h3>
                          <p className="subtle">A lightweight chart grouped by time period.</p>
                        </div>
                        <div className="view-toggle">
                          <button
                            className={analyticsGroupBy === "daily" ? "mini-tab active" : "mini-tab"}
                            type="button"
                            onClick={() => setAnalyticsGroupBy("daily")}
                          >
                            Daily
                          </button>
                          <button
                            className={analyticsGroupBy === "monthly" ? "mini-tab active" : "mini-tab"}
                            type="button"
                            onClick={() => setAnalyticsGroupBy("monthly")}
                          >
                            Monthly
                          </button>
                          <button
                            className={analyticsGroupBy === "yearly" ? "mini-tab active" : "mini-tab"}
                            type="button"
                            onClick={() => setAnalyticsGroupBy("yearly")}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>

                      {trendData.length ? (
                        <div className="trend-chart">
                          {trendData.slice(-10).map((item) => (
                            <div className="trend-bar-wrap" key={item.label}>
                              <div className="trend-value">{formatCurrency(item.value)}</div>
                              <div
                                className="trend-bar"
                                style={{
                                  height: `${maxTrendValue ? (item.value / maxTrendValue) * 100 : 0}%`,
                                }}
                              />
                              <div className="trend-label">{item.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">No analytics data available for the selected range.</div>
                      )}
                    </section>

                    <section className="panel-card">
                      <div className="panel-head">
                        <div>
                          <h3>Category Breakdown</h3>
                          <p className="subtle">Top categories by total spend.</p>
                        </div>
                      </div>

                      {topCategories.length ? (
                        <div className="category-list">
                          {topCategories.map(([categoryKey, total]) => {
                            const category = getCategoryDisplay(categoryKey);
                            const color =
                              CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.uncategorized;
                            const percent = analyticsTotal ? (total / analyticsTotal) * 100 : 0;

                            return (
                              <div className="category-row" key={categoryKey}>
                                <div className="category-row-head">
                                  <div className="category-name">
                                    <span
                                      className="expense-dot"
                                      style={{ backgroundColor: color }}
                                    />
                                    <strong>{category.label}</strong>
                                  </div>
                                  <span>{formatCurrency(total)}</span>
                                </div>
                                <div className="progress-track">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${percent}%`, backgroundColor: color }}
                                  />
                                </div>
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
              )}
            </section>
          ) : (
            <>
              <div className="tab-row" role="tablist" aria-label="Authentication mode">
                <button
                  className={mode === LOGIN ? "tab active" : "tab"}
                  type="button"
                  onClick={() => setMode(LOGIN)}
                >
                  Login
                </button>
                <button
                  className={mode === SIGNUP ? "tab active" : "tab"}
                  type="button"
                  onClick={() => setMode(SIGNUP)}
                >
                  Sign Up
                </button>
              </div>

              {mode === LOGIN ? (
                <form className="auth-form" onSubmit={handleLogin}>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                      placeholder="your@email.com"
                    />
                  </label>

                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, password: event.target.value }))
                      }
                      required
                      placeholder="••••••••"
                    />
                  </label>

                  <button className="primary-button" type="submit" disabled={submitting}>
                    {submitting ? "Signing In..." : "Login"}
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleSignup}>
                  <label>
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                      placeholder="John Doe"
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                      placeholder="your@email.com"
                    />
                  </label>

                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, password: event.target.value }))
                      }
                      required
                      minLength={6}
                      placeholder="••••••••"
                    />
                  </label>

                  <label>
                    <span>Confirm Password</span>
                    <input
                      type="password"
                      value={signupForm.confirmPassword}
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      required
                      minLength={6}
                      placeholder="••••••••"
                    />
                  </label>

                  <button className="primary-button" type="submit" disabled={submitting}>
                    {submitting ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              )}
            </>
          )}

          {status ? (
            <div className={status.type === "error" ? "status error" : "status success"}>
              {status.message}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
