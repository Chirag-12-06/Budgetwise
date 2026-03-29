import { useEffect, useState } from "react";
import { createExpense, fetchExpenses, getTodayDate, removeExpense } from "./lib/api";
import { getStoredUser, hasToken, loginUser, logoutUser, signupUser } from "./lib/auth";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Navbar from "./layout/Navbar";
import StatusBanner from "./layout/StatusBanner";

const LOGIN = "login";
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
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "dining", date: getTodayDate() });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

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
      const created = await createExpense({ title: expenseForm.title.trim(), amount: expenseForm.amount, category: expenseForm.category, date: expenseForm.date });
      setExpenses((current) => [created, ...current].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
      setExpenseForm((current) => ({ ...current, title: "", amount: "", date: getTodayDate() }));
      showStatus("Expense added successfully", "success");
    } catch (error) {
      showStatus(error.message || "Unable to add expense", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;
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
    setSignupForm({ name: "", email: "", password: "", confirmPassword: "" });
    setExpenseForm({ title: "", amount: "", category: "dining", date: getTodayDate() });
    setView(DASHBOARD);
    setDateFilterMode("allTime");
    setCustomDateFrom("");
    setCustomDateTo("");
    setMode(LOGIN);
    showStatus("Logged out", "success");
  }

  function applyDateFilter(list) {
    if (dateFilterMode === "allTime") return list;
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
  const monthSpent = expenses.filter((expense) => {
    const created = new Date(expense.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const latestExpenses = [...expenses].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 5);
  const filteredExpenses = applyDateFilter([...expenses].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
  const emptyFilteredState = filteredExpenses.length === 0 && expenses.length > 0;
  const analyticsExpenses = filteredExpenses;
  const analyticsTotal = analyticsExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryTotals = analyticsExpenses.reduce((accumulator, expense) => {
    const key = expense.category || "uncategorized";
    accumulator[key] = (accumulator[key] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});
  const topCategories = Object.entries(categoryTotals).sort((left, right) => right[1] - left[1]).slice(0, 6);
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
  const trendData = Object.entries(groupedTrendMap).sort(([left], [right]) => left.localeCompare(right)).map(([label, value]) => ({ label, value }));
  const maxTrendValue = trendData.reduce((max, item) => (item.value > max ? item.value : max), 0);

  return (
    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>
      <button className="theme-toggle" type="button" onClick={() => setDark((value) => !value)}>{dark ? "Light" : "Dark"}</button>
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
              <Navbar user={user} view={view} setView={setView} handleLogout={handleLogout} />

              {view === DASHBOARD ? (
                <DashboardPage totalSpent={totalSpent} monthSpent={monthSpent} expenses={expenses} latestExpenses={latestExpenses} loadingExpenses={loadingExpenses} expenseForm={expenseForm} setExpenseForm={setExpenseForm} handleAddExpense={handleAddExpense} submitting={submitting} />
              ) : view === EXPENSES ? (
                <ExpensesPage dateFilterMode={dateFilterMode} setDateFilterMode={setDateFilterMode} customDateFrom={customDateFrom} setCustomDateFrom={setCustomDateFrom} customDateTo={customDateTo} setCustomDateTo={setCustomDateTo} applyCustomDateRange={applyCustomDateRange} filteredExpenses={filteredExpenses} loadingExpenses={loadingExpenses} emptyFilteredState={emptyFilteredState} handleDeleteExpense={handleDeleteExpense} />
              ) : (
                <AnalyticsPage dateFilterMode={dateFilterMode} setDateFilterMode={setDateFilterMode} customDateFrom={customDateFrom} setCustomDateFrom={setCustomDateFrom} customDateTo={customDateTo} setCustomDateTo={setCustomDateTo} applyCustomDateRange={applyCustomDateRange} analyticsTotal={analyticsTotal} categoryTotals={categoryTotals} analyticsExpenses={analyticsExpenses} analyticsGroupBy={analyticsGroupBy} setAnalyticsGroupBy={setAnalyticsGroupBy} trendData={trendData} maxTrendValue={maxTrendValue} topCategories={topCategories} />
              )}
            </section>
          ) : (
            <AuthPage mode={mode} setMode={setMode} handleLogin={handleLogin} handleSignup={handleSignup} loginForm={loginForm} setLoginForm={setLoginForm} signupForm={signupForm} setSignupForm={setSignupForm} submitting={submitting} />
          )}

          <StatusBanner status={status} />
        </section>
      </main>
    </div>
  );
}

export default App;
