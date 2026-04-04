import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Navbar from "./layout/Navbar";
import StatusBanner from "./layout/StatusBanner";
import useAppController from "./hooks/useAppController";

const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

function App() {
  const {
    mode,
    setMode,
    view,
    setView,
    dark,
    setDark,
    status,
    submitting,
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
    handleAddExpense,
    handleStartEditExpense,
    handleCancelEditExpense,
    handleDeleteExpense,
    handleLogout,
    handleDateFilterModeChange,
    handleCustomDateFromChange,
    handleCustomDateToChange,
    applyCustomDateRange,
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
        <section
          className={`mx-auto w-full ${user ? "" : "max-w-xl"}`}
        >
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

              {view === DASHBOARD ? (
                <DashboardPage totalSpent={totalSpent} monthSpent={monthSpent} expenses={expenses} latestExpenses={latestExpenses} loadingExpenses={loadingExpenses} expenseForm={expenseForm} setExpenseForm={setExpenseForm} handleAddExpense={handleAddExpense} submitting={submitting} isEditingExpense={editingExpenseId !== null} handleCancelEditExpense={handleCancelEditExpense} />
              ) : view === EXPENSES ? (
                <ExpensesPage dateFilterMode={dateFilterMode} setDateFilterMode={handleDateFilterModeChange} customDateFrom={customDateFrom} setCustomDateFrom={handleCustomDateFromChange} customDateTo={customDateTo} setCustomDateTo={handleCustomDateToChange} applyCustomDateRange={applyCustomDateRange} dateRangeError={dateRangeError} filteredExpenses={filteredExpenses} loadingExpenses={loadingExpenses} emptyFilteredState={emptyFilteredState} handleDeleteExpense={handleDeleteExpense} handleStartEditExpense={handleStartEditExpense} expenses={expenses} categoryFilterExpenses={dateFilteredExpenses} selectedCategoryFilters={selectedCategoryFilters} onCategoryFilterToggle={handleCategoryFilterToggle} onClearCategoryFilters={clearCategoryFilters} />
              ) : (
                <AnalyticsPage dateFilterMode={dateFilterMode} setDateFilterMode={handleDateFilterModeChange} customDateFrom={customDateFrom} setCustomDateFrom={handleCustomDateFromChange} customDateTo={customDateTo} setCustomDateTo={handleCustomDateToChange} applyCustomDateRange={applyCustomDateRange} dateRangeError={dateRangeError} analyticsTotal={analyticsTotal} categoryTotals={categoryTotals} analyticsExpenses={analyticsExpenses} analyticsGroupBy={analyticsGroupBy} setAnalyticsGroupBy={setAnalyticsGroupBy} trendData={trendData} maxTrendValue={maxTrendValue} topCategories={topCategories} expenses={expenses} categoryFilterExpenses={dateFilteredExpenses} selectedCategoryFilters={selectedCategoryFilters} onCategoryFilterToggle={handleCategoryFilterToggle} onClearCategoryFilters={clearCategoryFilters} />
              )}
            </section>
          ) : (
            <AuthPage mode={mode} setMode={setMode} handleLogin={handleLogin} handleSignup={handleSignup} loginForm={loginForm} setLoginForm={setLoginForm} signupForm={signupForm} setSignupForm={setSignupForm} submitting={submitting} dark={dark} setDark={setDark} />
          )}

          {!user || view === DASHBOARD ? <StatusBanner status={status} /> : null}
        </section>
      </main>
    </div>
  );
}

export default App;
