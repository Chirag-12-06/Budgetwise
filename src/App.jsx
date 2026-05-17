import AuthPage from "./pages/AuthPage";
import AddExpensePage from "./pages/AddExpensePage";
import ExpensesPage from "./pages/ExpensesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./layout/Navbar";
import StatusBanner from "./layout/StatusBanner";
import useAppController from "./hooks/useAppController";
import useResizeSync from "./hooks/useResizeSync";

const ADD_EXPENSE = "addExpense";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";
const PROFILE = "profile";

function App() {
  useResizeSync();

  const {
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

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="min-h-screen px-4 pb-8">
        <section className={`mx-auto w-full ${user ? "" : "max-w-xl"}`}>
          {user ? (
            <section className="grid gap-12">
              <Navbar
                user={user}
                view={view}
                setView={setView}
                handleLogout={handleLogout}
                dark={dark}
                setDark={setDark}
              />

              {view === ADD_EXPENSE ? (
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
              ) : view === EXPENSES ? (
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
              ) : view === ANALYTICS ? (
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
              ) : view === PROFILE ? (
                <ProfilePage
                  user={user}
                  expenses={expenses}
                  totalSpent={totalSpent}
                  monthSpent={monthSpent}
                  onUpdateProfile={handleUpdateProfile}
                  updatingProfile={updatingProfile}
                />
              ) : null}
            </section>
          ) : (
            <AuthPage
              mode={mode}
              setMode={setMode}
              handleLogin={handleLogin}
              handleSignup={handleSignup}
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              signupForm={signupForm}
              setSignupForm={setSignupForm}
              submitting={submitting}
              dark={dark}
              setDark={setDark}
            />
          )}

          {!user || view === ADD_EXPENSE ? (
            <StatusBanner status={status} />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
