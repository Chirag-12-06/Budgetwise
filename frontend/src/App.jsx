import { Route, Routes } from "react-router-dom";
import useWindowResize from "./hooks/ui/useWindowResize";
import useAppController from "./hooks/useAppController";
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import StatusBanner from "./layout/StatusBanner";
import AddExpensePage from "./pages/AddExpensePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SignupPage from "./pages/auth/SignupPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ROUTES } from "./routes/routes";

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
    filteredExpenses,
    monthSpent,
    emptyFilteredState,
    analyticsExpenses,
    analyticsTotal,
    categoryTotals,
    trendData,
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
    dark,
    setDark,
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

        <Route
          path={ROUTES.RESET_PASSWORD}
          element={
            <ResetPasswordPage
              showStatus={showStatus}
              dark={dark}
              setDark={setDark}
            />
          }
        />

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
                  expenses={expenses}
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
