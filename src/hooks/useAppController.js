import { useEffect, useRef, useState } from "react";
import { createExpense, fetchExpenses, getTodayDate, removeExpense, updateExpense } from "../lib/api";
import { getStoredUser, hasToken, loginUser, logoutUser, signupUser, updateProfileUser } from "../lib/auth";
import { formatDateKey, formatTrendLabel } from "../utils/date";
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

function addIntervalByFrequency(dateInput, frequency) {
  if (frequency === "daily") {
    const date = new Date(dateInput);
    date.setDate(date.getDate() + 1);
    return date;
  }

  const date = new Date(dateInput);
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
    return date;
  }

  if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  if (frequency === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  return date;
}

function normalizeWeeklyDays(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((left, right) => left - right);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeWeeklyDays(parsed);
      }
    } catch {
      return value
        .split(",")
        .map((day) => Number(day.trim()))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((left, right) => left - right);
    }
  }

  return [];
}

function addWeeklyOccurrence(dateInput, weeklyDays) {
  const date = new Date(dateInput);
  const selectedDays = normalizeWeeklyDays(weeklyDays);
  if (!selectedDays.length) {
    date.setDate(date.getDate() + 7);
    return date;
  }

  const currentDay = date.getDay();
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidateDay = (currentDay + offset) % 7;
    if (selectedDays.includes(candidateDay)) {
      date.setDate(date.getDate() + offset);
      return date;
    }
  }

  date.setDate(date.getDate() + 7);
  return date;
}

function toInputDateString(dateInput) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deriveRecurrenceEndDate({ startDate, frequency, duration, repeatUntil, repeatCount, weeklyDays }) {
  if (!frequency) {
    return "";
  }

  if (duration === "until") {
    return repeatUntil || "";
  }

  const baseDate = new Date(startDate || getTodayDate());
  if (Number.isNaN(baseDate.getTime())) {
    return "";
  }

  if (duration === "forever") {
    const capped = new Date(baseDate);
    capped.setFullYear(capped.getFullYear() + 10);
    return toInputDateString(capped);
  }

  if (duration === "count") {
    const occurrences = Math.max(1, Number.parseInt(repeatCount, 10) || 1);
    let cursor = new Date(baseDate);
    for (let index = 0; index < occurrences; index += 1) {
      cursor = frequency === "weekly"
        ? addWeeklyOccurrence(cursor, weeklyDays)
        : addIntervalByFrequency(cursor, frequency);
    }
    return toInputDateString(cursor);
  }

  return "";
}

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
    recurrenceFrequency: "",
    recurrenceEndDate: "",
    recurrenceDuration: "until",
    recurrenceCount: "",
    recurrenceWeeklyDays: [],
    recurrenceMonthlyPattern: "date",
    recurrenceYearlyPattern: "date",
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: "",
  });
  const inactivityTimeoutRef = useRef(null);

  async function refreshExpenses(options = {}) {
    if (!user) {
      return [];
    }

    const data = await fetchExpenses(options);
    const normalized = Array.isArray(data) ? data : [];
    setExpenses(normalized);
    return normalized;
  }

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
    setExpenseForm({
      title: "",
      amount: "",
      category: "",
      date: getTodayDate(),
      recurrenceFrequency: "",
      recurrenceEndDate: "",
      recurrenceDuration: "until",
      recurrenceCount: "",
      recurrenceWeeklyDays: [],
      recurrenceMonthlyPattern: "date",
      recurrenceYearlyPattern: "date",
    });
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
        const data = await refreshExpenses();
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

    const computedRecurrenceEndDate = deriveRecurrenceEndDate({
      startDate: expenseForm.date,
      frequency: expenseForm.recurrenceFrequency,
      duration: expenseForm.recurrenceDuration,
      repeatUntil: expenseForm.recurrenceEndDate,
      repeatCount: expenseForm.recurrenceCount,
      weeklyDays: expenseForm.recurrenceWeeklyDays,
    });

    if (expenseForm.recurrenceFrequency && expenseForm.recurrenceDuration === "until" && !expenseForm.recurrenceEndDate) {
      showStatus("Select a recurrence end date", "error");
      return;
    }

    if (expenseForm.recurrenceFrequency && expenseForm.recurrenceDuration === "count" && !expenseForm.recurrenceCount) {
      showStatus("Enter number of repeat times", "error");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const payload = {
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      category: expenseForm.category,
      date: expenseForm.date,
      recurrenceFrequency: expenseForm.recurrenceFrequency,
      recurrenceEndDate: computedRecurrenceEndDate,
      recurrenceDuration: expenseForm.recurrenceFrequency ? expenseForm.recurrenceDuration : "until",
      recurrenceCount: expenseForm.recurrenceFrequency ? expenseForm.recurrenceCount : "",
      recurrenceWeeklyDays: expenseForm.recurrenceFrequency === "weekly"
        ? JSON.stringify(normalizeWeeklyDays(expenseForm.recurrenceWeeklyDays))
        : null,
      recurrenceMonthlyPattern: expenseForm.recurrenceFrequency === "monthly"
        ? expenseForm.recurrenceMonthlyPattern
        : "date",
      recurrenceYearlyPattern: expenseForm.recurrenceFrequency === "yearly"
        ? expenseForm.recurrenceYearlyPattern
        : "date",
    };

    try {
      if (editingExpenseId !== null) {
        await updateExpense(editingExpenseId, payload);
        const syncedExpenses = await fetchExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Expense updated successfully", "success");
      } else {
        await createExpense(payload);
        const syncedExpenses = await fetchExpenses();
        setExpenses(Array.isArray(syncedExpenses) ? syncedExpenses : []);
        showStatus("Expense added successfully", "success");
      }

      setExpenseForm((current) => ({
        ...current,
        title: "",
        amount: "",
        category: "",
        date: getTodayDate(),
        recurrenceFrequency: "",
        recurrenceEndDate: "",
        recurrenceDuration: "until",
        recurrenceCount: "",
        recurrenceWeeklyDays: [],
        recurrenceMonthlyPattern: "date",
        recurrenceYearlyPattern: "date",
      }));
      setEditingExpenseId(null);
    } catch (error) {
      handleApiError(error, editingExpenseId !== null ? "Unable to update expense" : "Unable to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartEditExpense(expense) {
    let sourceExpense = expense;

    if (expense?.recurringParentId) {
      const localParent = expenses.find((item) => item.id === expense.recurringParentId);
      if (localParent) {
        sourceExpense = localParent;
      } else {
        try {
          const fetchedExpenses = await fetchExpenses();
          const remoteParent = Array.isArray(fetchedExpenses)
            ? fetchedExpenses.find((item) => item.id === expense.recurringParentId)
            : null;
          if (remoteParent) {
            sourceExpense = remoteParent;
          }
        } catch {
          // Fall back to selected expense if parent lookup fails.
        }
      }
    }

    const dateValue = sourceExpense?.createdAt ? formatDateKey(sourceExpense.createdAt) : getTodayDate();
    const parsedWeeklyDays = normalizeWeeklyDays(sourceExpense?.recurrenceWeeklyDays);
    const fallbackWeeklyDay = sourceExpense?.createdAt
      ? new Date(sourceExpense.createdAt).getDay()
      : new Date(getTodayDate()).getDay();
    const resolvedWeeklyDays =
      sourceExpense?.recurrenceFrequency === "weekly"
      && parsedWeeklyDays.length === 0
      && Number.isInteger(fallbackWeeklyDay)
      && fallbackWeeklyDay >= 0
      && fallbackWeeklyDay <= 6
        ? [fallbackWeeklyDay]
        : parsedWeeklyDays;
    setEditingExpenseId(sourceExpense.id);
    setExpenseForm({
      title: sourceExpense.title || "",
      amount:
        sourceExpense.amount !== undefined && sourceExpense.amount !== null
          ? String(sourceExpense.amount)
          : "",
      category: sourceExpense.category || "",
      date: dateValue,
      recurrenceFrequency: sourceExpense.recurrenceFrequency || "",
      recurrenceEndDate: sourceExpense.recurrenceEndDate
        ? formatDateKey(sourceExpense.recurrenceEndDate)
        : "",
      recurrenceDuration:
        sourceExpense.recurrenceDuration || (sourceExpense.recurrenceFrequency ? "until" : "until"),
      recurrenceCount: sourceExpense.recurrenceCount
        ? String(sourceExpense.recurrenceCount)
        : "",
      recurrenceWeeklyDays: resolvedWeeklyDays,
      recurrenceMonthlyPattern: sourceExpense.recurrenceMonthlyPattern || "date",
      recurrenceYearlyPattern: sourceExpense.recurrenceYearlyPattern || "date",
    });
    setView(ADD_EXPENSE);
    setStatus(null);
  }

  function handleCancelEditExpense() {
    setEditingExpenseId(null);
    setExpenseForm({
      title: "",
      amount: "",
      category: "",
      date: getTodayDate(),
      recurrenceFrequency: "",
      recurrenceEndDate: "",
      recurrenceDuration: "until",
      recurrenceCount: "",
      recurrenceWeeklyDays: [],
      recurrenceMonthlyPattern: "date",
      recurrenceYearlyPattern: "date",
    });
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

  function formatLocalDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getPresetDateRange(modeValue, now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();

    if (modeValue === "thisMonth") {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
        generateUpTo: formatLocalDateInput(end),
      };
    }

    if (modeValue === "lastMonth") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
        generateUpTo: formatLocalDateInput(end),
      };
    }

    if (modeValue === "thisYear") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return {
        from: formatLocalDateInput(start),
        to: formatLocalDateInput(end),
        generateUpTo: formatLocalDateInput(end),
      };
    }

    return null;
  }

  async function handleDateFilterModeChange(modeValue) {
    setDateFilterMode(modeValue);
    setSelectedCategoryFilters([]);

    if (modeValue !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }

    setDateRangeError("");

    const presetRange = getPresetDateRange(modeValue);
    if (!presetRange && modeValue === "custom") {
      return;
    }

    try {
      await refreshExpenses(
        presetRange?.generateUpTo ? { generateUpTo: presetRange.generateUpTo } : {},
      );
    } catch (error) {
      handleApiError(error, "Unable to load expenses for the selected date range");
    }
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
    setSelectedCategoryFilters([]);

    void refreshExpenses({ generateUpTo: nextTo }).catch((error) => {
      handleApiError(error, "Unable to sync recurring expenses for selected date");
    });
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
    setSelectedCategoryFilters([]);

    void refreshExpenses({
      generateUpTo: customDateTo || customDateFrom,
    }).catch((error) => {
      handleApiError(error, "Unable to sync recurring expenses for selected date");
    });
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
      setSelectedCategoryFilters([]);
      void refreshExpenses({
        generateUpTo: point.dateKey,
      }).catch((error) => {
        handleApiError(error, "Unable to sync recurring expenses for selected date");
      });
      return;
    }

    if (point.rangeFrom && point.rangeTo) {
      setCustomDateFrom(point.rangeFrom);
      setCustomDateTo(point.rangeTo);
      setDateFilterMode("custom");
      setDateRangeError("");
      setSelectedCategoryFilters([]);
      void refreshExpenses({
        generateUpTo: point.rangeTo,
      }).catch((error) => {
        handleApiError(error, "Unable to sync recurring expenses for selected range");
      });
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
    const expenseDateKey = formatDateKey(expense.createdAt);
    const [yearPart = "", monthPart = ""] = String(expenseDateKey).split("-");
    let key;
    if (analyticsGroupBy === "monthly") {
      key = `${yearPart}-${monthPart}`;
    } else if (analyticsGroupBy === "yearly") {
      key = `${yearPart}`;
    } else {
      key = expenseDateKey;
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
