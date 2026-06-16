import { useEffect, useState } from "react";
import { createExpense, createRecurringExpense, fetchExpenses, fetchRecurringExpense, getTodayDate, removeExpense, removeRecurringExpense, updateExpense, updateRecurringExpense } from "../lib/api";
import { getStoredUser, hasToken, loginUser, logoutUser, signupUser, updateProfileUser } from "../lib/auth";
import { formatDateKey, formatTrendLabel } from "../utils/date";
import { applyDateFilter, validateCustomDateRange } from "../utils/dateFilters";
import useDarkMode from "./useDarkMode";
import useSessionTimeout from "./useSessionTimeout";
import useStatusMessage from "./useStatusMessage";
import useDateFilters from "./useDateFilters";
import useCategoryFilters from "./useCategoryFilters";
import useAuthController from "./useAuthController";
import useExpenseCrud from "./useExpenseCrud";
import useRecurringExpenseActions from "./useRecurringExpenseActions";
import { useNavigate } from "react-router-dom";


export default function useAppController() {
  const navigate = useNavigate();
  const { dark, setDark } = useDarkMode();
  const [submitting, setSubmitting] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState("daily");
  const [user, setUser] = useState(() => (hasToken() ? getStoredUser() : null));
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [editingRecurringExpenseId, setEditingRecurringExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: getTodayDate(),
    editScope: null,
  });
  const [recurringForm, setRecurringForm] = useState({
    enabled: false,
    frequency: "MONTHLY",
    intervalValue: "1",
    endType: "FOREVER",
    endCount: "",
    endDate: "",
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: "",
  });
  const { clearInactivityTimeout } =
  useSessionTimeout({
    user,
    resetToLoggedOutState,
  });
const {
  status,
  clearStatus,
  showStatus,
} = useStatusMessage();
const {
  selectedCategoryFilters,
  setSelectedCategoryFilters,
  handleCategoryFilterToggle,
  clearCategoryFilters,
} = useCategoryFilters();
const {
  refreshExpenses,
  handleAddExpense,
  handleStartEditExpense,
  handleCancelEditExpense,
  handleDeleteExpense,
} = useExpenseCrud({
   user,
  expenseForm,
  recurringForm,

  editingExpenseId,
  editingRecurringExpenseId,

  setEditingExpenseId,
  setEditingRecurringExpenseId,

  setExpenseForm,
  setRecurringForm,

  setExpenses,
  setSubmitting,
  setLoadingExpenses,
  handleApiError,
  showStatus,
  clearStatus,

  navigate,
});
const{
  recurringExpenseActionPrompt,
  handleStartEditRecurringExpense,
  handleRecurringExpenseActionRequest,
  handleCloseRecurringExpenseActionPrompt,
  handleRecurringExpenseActionSelect,
} = useRecurringExpenseActions({
  editingExpenseId,
  expenseForm,
  setExpenseForm,
  recurringForm,
  setRecurringForm,
  setExpenses,
  setSubmitting,
  showStatus,
  handleApiError,
  refreshExpenses,
  handleStartEditExpense,
  handleDeleteExpense,
  handleCancelEditExpense,
  navigate,
  editingRecurringExpenseId,
  setEditingRecurringExpenseId,
  setEditingExpenseId,
  clearStatus,
});


const {
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  customDateTo,
  dateRangeError,
  handleCustomDateFromChange,
  handleCustomDateToChange,
  applyCustomDateRange,
  handleDateFilterModeChange,
} = useDateFilters({
  refreshExpenses,
  handleApiError,
  setSelectedCategoryFilters,
});
const {
  handleLogin,
  handleSignup,
  handleUpdateProfile,
  handleForgotPassword,
  handleLogout,
} = useAuthController({
  loginForm,
  signupForm,
  user,
  setUser,
  navigate,
  setSubmitting,
  setUpdatingProfile,
  showStatus,
  resetToLoggedOutState,
  clearStatus,
});
  

  function resetToLoggedOutState({ message = "Logged out", type = "success" } = {}) {
    showStatus(message, type);
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
      editScope: null,
    });
    setRecurringForm({
      enabled: false,
      frequency: "MONTHLY",
      intervalValue: "1",
      endType: "FOREVER",
      endCount: "",
      endDate: "",
    });
    setEditingExpenseId(null);
    navigate("/auth");
    setDateFilterMode("month:current");
    setSelectedCategoryFilters([]);
    setCustomDateFrom("");
    setCustomDateTo("");
    setDateRangeError("");
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
    if (!user || hasToken()) {
      return;
    }

    resetToLoggedOutState({
      message: "Session expired. Please log in again.",
      type: "error",
    });
  }, [user]);
  

  function handleCancelEditRecurringExpense() {
    handleCancelEditExpense();
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
      void refreshExpenses().catch((error) => {
        handleApiError(error, "Unable to load expenses for selected date");
      });
      return;
    }

    if (point.rangeFrom && point.rangeTo) {
      setCustomDateFrom(point.rangeFrom);
      setCustomDateTo(point.rangeTo);
      setDateFilterMode("custom");
      setDateRangeError("");
      setSelectedCategoryFilters([]);
      void refreshExpenses().catch((error) => {
        handleApiError(error, "Unable to load expenses for selected range");
      });
    }
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
    navigate,
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
    editingRecurringExpenseId,
    recurringExpenseActionPrompt,
    loginForm,
    setLoginForm,
    expenseForm,
    setExpenseForm,
    recurringForm,
    setRecurringForm,
    signupForm,
    setSignupForm,
    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleUpdateProfile,
    handleAddExpense,
    handleStartEditExpense,
    handleStartEditRecurringExpense,
    handleCancelEditExpense,
    handleCancelEditRecurringExpense,
    handleDeleteExpense,
    handleRecurringExpenseActionRequest,
    handleCloseRecurringExpenseActionPrompt,
    handleRecurringExpenseActionSelect,
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
