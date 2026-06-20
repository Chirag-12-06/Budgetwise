import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, hasToken, logoutUser } from "../lib/auth";
import { ROUTES } from "../lib/routes";
import { formatDateKey, formatTrendLabel } from "../utils/date";
import {
  createDefaultExpenseForm,
  createDefaultRecurringForm,
} from "../utils/defaultforms";
import useAuthController from "./auth/useAuthController";
import useSessionTimeout from "./auth/useSessionTimeout";
import useStatusMessage from "./auth/useStatusMessage";
import useCategoryFilters from "./expenses/useCategoryFilters";
import useExpenseCrud from "./expenses/useExpenseCrud";
import useRecurringExpenseActions from "./expenses/useRecurringExpenseActions";
import useDateFilter from "./filters/useDateFilters";
import useDarkMode from "./ui/useDarkMode";
import { resolveDateRange } from "../utils/dateFilters";

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
  const [expenseForm, setExpenseForm] = useState(createDefaultExpenseForm());
  const [recurringForm, setRecurringForm] = useState(createDefaultRecurringForm(),);
  const [activeDateRange, setActiveDateRange] = useState({
    from: "",
    to: "",
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: "",
  });
  const { clearInactivityTimeout } = useSessionTimeout({
    user,
    resetToLoggedOutState,
  });
  const { status, clearStatus, showStatus } = useStatusMessage();
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
    activeDateRange,
  });
  const handleCancelEditRecurringExpense = handleCancelEditExpense;
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
    activateCustomDateRange,
      setCustomDateFrom,
      setCustomDateTo,
      setDateRangeError,
  } = useDateFilter({
    refreshExpenses,
    handleApiError,
    setSelectedCategoryFilters,
    setActiveDateRange,
  });
  const {
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
    activeDateRange,
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

  function resetToLoggedOutState({
    message = "Logged out",
    type = "success",
  } = {}) {
    showStatus(message, type);
    clearInactivityTimeout();
    logoutUser();
    setUser(null);
    setExpenses([]);
    setLoginForm({ email: "", password: "" });
    setSignupForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatarDataUrl: "",
    });
    setExpenseForm(createDefaultExpenseForm());
    setRecurringForm(createDefaultRecurringForm());
    setEditingExpenseId(null);
    navigate(ROUTES.LOGIN);
    setDateFilterMode("current:month");
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
      const today = formatDateKey(new Date());

  const now = new Date();
  const monthStart =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      try {
        await refreshExpenses(activeDateRange);
      } catch (error) {
        if (!ignore) {
          handleApiError(error, "Unable to load expenses");
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

  function activateCustomDateFilter(from, to) {
    activateCustomDateRange(from, to);
    setSelectedCategoryFilters([]);
  }

 function handleTrendPointDateSelect(point) {
  if (!point) {
    return;
  }

  if (point.dateKey) {
    activateCustomDateFilter(point.dateKey, point.dateKey);

    const range = {
      from: point.dateKey,
      to: point.dateKey,
    };

    setActiveDateRange(range);

    void refreshExpenses(range).catch((error) => {
      handleApiError(error, "Unable to load expenses for selected date");
    });

    return;
  }

  if (point.rangeFrom && point.rangeTo) {
    activateCustomDateFilter(point.rangeFrom, point.rangeTo);

    const range = {
      from: point.rangeFrom,
      to: point.rangeTo,
    };

    setActiveDateRange(range);

    void refreshExpenses(range).catch((error) => {
      handleApiError(error, "Unable to load expenses for selected range");
    });
  }
}

  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const monthSpent = expenses
    .filter((expense) => {
      const created = new Date(expense.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const latestExpenses = [...expenses]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);
  const { startDate, endDate } = resolveDateRange({
  dateFilterMode,
  customDateFrom,
  customDateTo,
});

const dateFilteredExpenses = expenses
  .filter((expense) => {
    const expenseDate = new Date(expense.createdAt);

    if (startDate && expenseDate < startDate) {
      return false;
    }

    if (endDate && expenseDate > endDate) {
      return false;
    }

    return true;
  })
  .sort(
    (left, right) =>
      new Date(right.createdAt) - new Date(left.createdAt),
  );
  const filteredExpenses = selectedCategoryFilters.length
    ? dateFilteredExpenses.filter((expense) =>
        selectedCategoryFilters.includes(expense.category || "uncategorized"),
      )
    : dateFilteredExpenses;
  const emptyFilteredState =
    filteredExpenses.length === 0 && expenses.length > 0;
  const analyticsExpenses = filteredExpenses;
  const analyticsTotal = analyticsExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
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
    const expenseDateKey = formatDateKey(expense.createdAt);
    const [yearPart = "", monthPart = ""] = String(expenseDateKey).split("-");
    let key;
    if (analyticsGroupBy === "yearly") {
  key = yearPart;
} else if (analyticsGroupBy === "monthly") {
  key = `${yearPart}-${monthPart}`;
} else if (analyticsGroupBy === "weekly") {
  const date = new Date(expense.createdAt);

  // Monday start
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - offset);

  key = formatDateKey(date);
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

      if (analyticsGroupBy === "weekly") {
  const start = new Date(bucketKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    ...point,
    dateKey: "",
    rangeFrom: formatDateKey(start),
    rangeTo: formatDateKey(end),
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
  const maxTrendValue = trendData.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0,
  );

  return {
    navigate,
    dark,
    setDark,
    status,
    showStatus,
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
