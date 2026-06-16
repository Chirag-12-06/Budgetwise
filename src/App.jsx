import { Route, Routes } from "react-router-dom";
import useAppController from "./hooks/useAppController";
import useWindowResize from "./hooks/useWindowResize";
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import StatusBanner from "./layout/StatusBanner";
import { ROUTES } from "./lib/routes";
import AddExpensePage from "./pages/AddExpensePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthPage from "./pages/AuthPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  useWindowResize();

  const {
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
    handleCancelEditExpense,
    handleCancelEditRecurringExpense,
    handleDeleteExpense,
    recurringExpenseActionPrompt,
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
  } = useAppController();

  const authPageProps = {
    handleLogin,
    handleSignup,
    handleForgotPassword,
    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,
    submitting,
    dark,
    setDark,
  };

  return (
    <>
      <Routes>
        <Route element={<AuthLayout dark={dark} />}>
          <Route path={ROUTES.LOGIN} element={<AuthPage {...authPageProps} />} />

          <Route
            path={ROUTES.SIGNUP}
            element={<AuthPage {...authPageProps} />}
          />

          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<AuthPage {...authPageProps} />}
          />
        </Route>

        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute user={user} />}>
          <Route
            element={
              <AppLayout
                user={user}
                handleLogout={handleLogout}
                dark={dark}
                setDark={setDark}
              />
            }
          >
            <Route
              path={ROUTES.HOME}
              element={
                <AddExpensePage
                  totalSpent={totalSpent}
                  monthSpent={monthSpent}
                  expenses={expenses}
                  latestExpenses={latestExpenses}
                  loadingExpenses={loadingExpenses}
                  expenseForm={expenseForm}
                  setExpenseForm={setExpenseForm}
                  recurringForm={recurringForm}
                  setRecurringForm={setRecurringForm}
                  handleAddExpense={handleAddExpense}
                  submitting={submitting}
                  isEditingExpense={editingExpenseId !== null}
                  isEditingFuture={expenseForm.editScope === "future"}
                  isEditingRecurringSeries={editingRecurringExpenseId !== null}
                  handleCancelEditExpense={handleCancelEditExpense}
                  handleCancelEditRecurringExpense={
                    handleCancelEditRecurringExpense
                  }
                  recurringExpenseActionPrompt={recurringExpenseActionPrompt}
                  onRecurringExpenseActionRequest={
                    handleRecurringExpenseActionRequest
                  }
                  onRecurringExpenseActionClose={
                    handleCloseRecurringExpenseActionPrompt
                  }
                  onRecurringExpenseActionSelect={
                    handleRecurringExpenseActionSelect
                  }
                />
              }
            />
            <Route
              path={ROUTES.EXPENSES}
              element={
                <ExpensesPage
                  dateFilterMode={dateFilterMode}
                  setDateFilterMode={handleDateFilterModeChange}
                  customDateFrom={customDateFrom}
                  setCustomDateFrom={handleCustomDateFromChange}
                  customDateTo={customDateTo}
                  setCustomDateTo={handleCustomDateToChange}
                  applyCustomDateRange={applyCustomDateRange}
                  dateRangeError={dateRangeError}
                  filteredExpenses={filteredExpenses}
                  loadingExpenses={loadingExpenses}
                  emptyFilteredState={emptyFilteredState}
                  handleDeleteExpense={handleDeleteExpense}
                  handleStartEditExpense={handleStartEditExpense}
                  recurringExpenseActionPrompt={recurringExpenseActionPrompt}
                  onRecurringExpenseActionRequest={
                    handleRecurringExpenseActionRequest
                  }
                  onRecurringExpenseActionClose={
                    handleCloseRecurringExpenseActionPrompt
                  }
                  onRecurringExpenseActionSelect={
                    handleRecurringExpenseActionSelect
                  }
                  expenses={expenses}
                  categoryFilterExpenses={dateFilteredExpenses}
                  selectedCategoryFilters={selectedCategoryFilters}
                  onCategoryFilterToggle={handleCategoryFilterToggle}
                  onClearCategoryFilters={clearCategoryFilters}
                />
              }
            />
            <Route
              path={ROUTES.ANALYTICS}
              element={
                <AnalyticsPage
                  dateFilterMode={dateFilterMode}
                  setDateFilterMode={handleDateFilterModeChange}
                  customDateFrom={customDateFrom}
                  setCustomDateFrom={handleCustomDateFromChange}
                  customDateTo={customDateTo}
                  setCustomDateTo={handleCustomDateToChange}
                  applyCustomDateRange={applyCustomDateRange}
                  onTrendPointDateSelect={handleTrendPointDateSelect}
                  dateRangeError={dateRangeError}
                  analyticsTotal={analyticsTotal}
                  categoryTotals={categoryTotals}
                  analyticsExpenses={analyticsExpenses}
                  analyticsGroupBy={analyticsGroupBy}
                  setAnalyticsGroupBy={setAnalyticsGroupBy}
                  trendData={trendData}
                  maxTrendValue={maxTrendValue}
                  topCategories={topCategories}
                  expenses={expenses}
                  categoryFilterExpenses={dateFilteredExpenses}
                  selectedCategoryFilters={selectedCategoryFilters}
                  onCategoryFilterToggle={handleCategoryFilterToggle}
                  onClearCategoryFilters={clearCategoryFilters}
                />
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProfilePage
                  user={user}
                  expenses={expenses}
                  totalSpent={totalSpent}
                  monthSpent={monthSpent}
                  onUpdateProfile={handleUpdateProfile}
                  updatingProfile={updatingProfile}
                />
              }
            />
          </Route>
        </Route>
      </Routes>
      <StatusBanner status={status} />
    </>
  );
}

export default App;
