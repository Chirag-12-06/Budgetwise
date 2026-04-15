import { useEffect, useRef, useState } from "react";
import { createExpense, fetchExpenses, getTodayDate, removeExpense, updateExpense } from "../lib/api";
import { getStoredUser, hasToken, loginUser, logoutUser, signupUser, updateProfileUser } from "../lib/auth";
import { formatTrendLabel } from "../utils/date";
import { applyDateFilter, validateCustomDateRange } from "../utils/dateFilters";

const LOGIN = "login";
const ADD_EXPENSE = "addExpense";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_IDLE_MINUTES = parsePositiveNumber(import.meta.env.VITE_SESSION_IDLE_MINUTES, 15);
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_MINUTES * 60 * 1000;

export default function useAppController() {
  const [mode, setMode] = useState(LOGIN);
  const [view, setView] = useState(ADD_EXPENSE);
  const [dark, setDark] = useState(() => localStorage.getItem("bw-dark") === "1");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState("allTime");
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState("daily");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");
  const [user, setUser] = useState(() => (hasToken() ? getStoredUser() : null));
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: getTodayDate(),
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: "",
  });
  const inactivityTimeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bw-dark", dark ? "1" : "0");
  }, [dark]);

  function showStatus(message, type) {
    setStatus({ message, type });
  }

  function clearInactivityTimeout() {
    if (!inactivityTimeoutRef.current) {
      return;
    }

    window.clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = null;
  }

  function resetToLoggedOutState({ message = "Logged out", type = "success" } = {}) {
    clearInactivityTimeout();
    logoutUser();
    setUser(null);
    setExpenses([]);
    setLoginForm({ email: "", password: "" });
    setSignupForm({ name: "", email: "", password: "", confirmPassword: "", avatarDataUrl: "" });
    setExpenseForm({ title: "", amount: "", category: "", date: getTodayDate() });
    setEditingExpenseId(null);
    setView(ADD_EXPENSE);
    setDateFilterMode("allTime");
    setSelectedCategoryFilters([]);
    setCustomDateFrom("");
    setCustomDateTo("");
    setDateRangeError("");
    setMode(LOGIN);
    showStatus(message, type);
  }

  function handleApiError(error, fallbackMessage) {
    const message = error?.message || fallbackMessage;
    if (user && !hasToken()) {
      resetToLoggedOutState({
        message: message || "Session expired. Please log in again.",
        type: "error",
      });
      return;
    }

    showStatus(message, "error");
  }

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
          handleApiError(error, "Unable to load expenses");
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

  useEffect(() => {
    if (!status) {
      return undefined;
    }

    if (user && view !== ADD_EXPENSE) {
      setStatus(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, user, view]);

  useEffect(() => {
    if (!user) {
      clearInactivityTimeout();
      return undefined;
    }

    let isLoggingOut = false;

    function resetInactivityTimer() {
      clearInactivityTimeout();
      inactivityTimeoutRef.current = window.setTimeout(() => {
        if (isLoggingOut) {
          return;
        }

        isLoggingOut = true;
        resetToLoggedOutState({
          message: `Logged out after ${SESSION_IDLE_MINUTES} minutes of inactivity`,
          type: "error",
        });
      }, SESSION_IDLE_TIMEOUT_MS);
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    }

    resetInactivityTimer();

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetInactivityTimer);
      }

      clearInactivityTimeout();
    };
  }, [user]);

  useEffect(() => {
    if (!user || hasToken()) {
      return;
    }

    resetToLoggedOutState({
      message: "Session expired. Please log in again.",
      type: "error",
    });
  }, [user]);

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const data = await loginUser(loginForm);
      setUser(data.user);
      setView(ADD_EXPENSE);
      showStatus("Login successful", "success");
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
      setView(ADD_EXPENSE);
      showStatus("Account created successfully.", "success");
    } catch (error) {
      showStatus(error.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProfile(profilePayload) {
    setUpdatingProfile(true);
    try {
      const data = await updateProfileUser(profilePayload);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      if (user && !hasToken()) {
        resetToLoggedOutState({
          message: error?.message || "Session expired. Please log in again.",
          type: "error",
        });
      }

      return {
        ok: false,
        message: error.message || "Unable to update profile",
      };
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleAddExpense(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const payload = {
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      category: expenseForm.category,
      date: expenseForm.date,
    };

    try {
      if (editingExpenseId !== null) {
        const updated = await updateExpense(editingExpenseId, payload);
        setExpenses((current) =>
          current
            .map((expense) => (expense.id === editingExpenseId ? updated : expense))
            .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
        );
        showStatus("Expense updated successfully", "success");
      } else {
        const created = await createExpense(payload);
        setExpenses((current) =>
          [created, ...current].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
        );
        showStatus("Expense added successfully", "success");
      }

      setExpenseForm((current) => ({ ...current, title: "", amount: "", category: "", date: getTodayDate() }));
      setEditingExpenseId(null);
    } catch (error) {
      handleApiError(error, editingExpenseId !== null ? "Unable to update expense" : "Unable to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEditExpense(expense) {
    const dateValue = expense?.createdAt ? String(expense.createdAt).split("T")[0] : getTodayDate();
    setEditingExpenseId(expense.id);
    setExpenseForm({
      title: expense.title || "",
      amount: expense.amount !== undefined && expense.amount !== null ? String(expense.amount) : "",
      category: expense.category || "",
      date: dateValue,
    });
    setView(ADD_EXPENSE);
    setStatus(null);
  }

  function handleCancelEditExpense() {
    setEditingExpenseId(null);
    setExpenseForm({ title: "", amount: "", category: "", date: getTodayDate() });
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;
    try {
      await removeExpense(id);
      setExpenses((current) => current.filter((expense) => expense.id !== id));
      if (id === editingExpenseId) {
        handleCancelEditExpense();
      }
      showStatus("Expense deleted successfully", "success");
    } catch (error) {
      handleApiError(error, "Failed to delete expense");
    }
  }

  function handleLogout() {
    resetToLoggedOutState();
  }

  function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }

    setDateRangeError("");
  }

  function syncCustomDateFilter(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) {
      setDateRangeError("Select both From and To dates to apply filter");
      return;
    }

    if (new Date(nextFrom) > new Date(nextTo)) {
      setDateRangeError("From date cannot be later than To date");
      return;
    }

    setDateRangeError("");
    setDateFilterMode("custom");
  }

  function handleCustomDateFromChange(value) {
    const nextFrom = value;
    let nextTo = customDateTo;

    if (value && (!nextTo || new Date(value) > new Date(nextTo))) {
      nextTo = value;
      setCustomDateTo(value);
    }

    setCustomDateFrom(nextFrom);
    syncCustomDateFilter(nextFrom, nextTo);
  }

  function handleCustomDateToChange(value) {
    const nextTo = value;
    let nextFrom = customDateFrom;

    if (value && (!nextFrom || new Date(value) < new Date(nextFrom))) {
      nextFrom = value;
      setCustomDateFrom(value);
    }

    setCustomDateTo(nextTo);
    syncCustomDateFilter(nextFrom, nextTo);
  }

  function applyCustomDateRange() {
    const validationError = validateCustomDateRange(customDateFrom, customDateTo);
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }
    setDateRangeError("");
    setDateFilterMode("custom");
  }

  function handleTrendPointDateSelect(point) {
    if (!point) {
      return;
    }

    if (point.dateKey) {
      setCustomDateFrom(point.dateKey);
      setCustomDateTo(point.dateKey);
      setDateFilterMode("custom");
      setDateRangeError("");
      return;
    }

    if (point.rangeFrom && point.rangeTo) {
      setCustomDateFrom(point.rangeFrom);
      setCustomDateTo(point.rangeTo);
      setDateFilterMode("custom");
      setDateRangeError("");
    }
  }

  function handleCategoryFilterToggle(categoryValue) {
    const normalizedValue = categoryValue || "uncategorized";
    setSelectedCategoryFilters((current) =>
      current.includes(normalizedValue)
        ? current.filter((value) => value !== normalizedValue)
        : [...current, normalizedValue],
    );
  }

  function clearCategoryFilters() {
    setSelectedCategoryFilters([]);
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
  const dateFilteredExpenses = applyDateFilter(
    [...expenses].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    { dateFilterMode, customDateFrom, customDateTo },
  );
  const filteredExpenses = selectedCategoryFilters.length
    ? dateFilteredExpenses.filter((expense) =>
      selectedCategoryFilters.includes(expense.category || "uncategorized"),
    )
    : dateFilteredExpenses;
  const emptyFilteredState = filteredExpenses.length === 0 && expenses.length > 0;
  const analyticsExpenses = filteredExpenses;
  const analyticsTotal = analyticsExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
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
    .map(([bucketKey, value]) => {
      const point = {
        bucketKey,
        label: formatTrendLabel(bucketKey, analyticsGroupBy),
        value,
      };

      if (analyticsGroupBy === "daily") {
        return {
          ...point,
          dateKey: bucketKey,
          rangeFrom: bucketKey,
          rangeTo: bucketKey,
        };
      }

      if (analyticsGroupBy === "monthly") {
        const [year, month] = bucketKey.split("-");
        const endDay = new Date(Number(year), Number(month), 0).getDate();
        const monthStart = `${year}-${month}-01`;
        const monthEnd = `${year}-${month}-${String(endDay).padStart(2, "0")}`;
        return {
          ...point,
          dateKey: "",
          rangeFrom: monthStart,
          rangeTo: monthEnd,
        };
      }

      const yearStart = `${bucketKey}-01-01`;
      const yearEnd = `${bucketKey}-12-31`;
      return {
        ...point,
        dateKey: "",
        rangeFrom: yearStart,
        rangeTo: yearEnd,
      };
    });
  const maxTrendValue = trendData.reduce((max, item) => (item.value > max ? item.value : max), 0);

  return {
    mode,
    setMode,
    view,
    setView,
    dark,
    setDark,
    status,
    submitting,
    updatingProfile,
    loadingExpenses,
    dateFilterMode,
    selectedCategoryFilters,
    analyticsGroupBy,
    setAnalyticsGroupBy,
    customDateFrom,
    customDateTo,
    dateRangeError,
    user,
    expenses,
    editingExpenseId,
    loginForm,
    setLoginForm,
    expenseForm,
    setExpenseForm,
    signupForm,
    setSignupForm,
    handleLogin,
    handleSignup,
    handleUpdateProfile,
    handleAddExpense,
    handleStartEditExpense,
    handleCancelEditExpense,
    handleDeleteExpense,
    handleLogout,
    handleDateFilterModeChange,
    handleCustomDateFromChange,
    handleCustomDateToChange,
    applyCustomDateRange,
    handleTrendPointDateSelect,
    handleCategoryFilterToggle,
    clearCategoryFilters,
    totalSpent,
    monthSpent,
    latestExpenses,
    dateFilteredExpenses,
    filteredExpenses,
    emptyFilteredState,
    analyticsExpenses,
    analyticsTotal,
    categoryTotals,
    topCategories,
    trendData,
    maxTrendValue,
  };
}
