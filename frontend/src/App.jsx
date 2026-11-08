import { Route, Routes } from "react-router-dom";
import useAppController from "./hooks/useAppController";
import useWindowResize from "./hooks/ui/useWindowResize";
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import StatusBanner from "./layout/StatusBanner";
import { ROUTES } from "./routes/routes";
import AddExpensePage from "./pages/AddExpensePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
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
    showStatus,
    submitting,
    updatingProfile,
    loadingExpenses,
    dateFilterMode,
    selectedCategoryFilters,
    analyticsGroupBy,
    handleAnalyticsGroupByChange,
    customDateFrom,
    customDateTo,
    dateRangeError,
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
    user,
    authLoading,
  } = useAppController();

const loginPageProps = {
  handleLogin,
  loginForm,
  setLoginForm,
  submitting,
  dark,
  setDark,
};

const signupPageProps = {
  handleSignup,
  signupForm,
  setSignupForm,
  submitting,
  dark,
  setDark,
};

const forgotPasswordPageProps = {
  handleForgotPassword,
};

  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
  <Route
    path={ROUTES.LOGIN}
    element={<LoginPage {...loginPageProps} />}
  />

  <Route
    path={ROUTES.SIGNUP}
    element={<SignupPage {...signupPageProps} />}
  />

  <Route
    path={ROUTES.FORGOT_PASSWORD}
    element={<ForgotPasswordPage {...forgotPasswordPageProps} />}
  />
</Route>

        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute user={user} loading={authLoading} />}>
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
                  expenses={expenses}
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
                  handleAnalyticsGroupByChange={handleAnalyticsGroupByChange}
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
                  showStatus={showStatus}
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
