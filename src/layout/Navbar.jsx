import Button from "../components/button";

const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

export default function Navbar({ user, view, setView, handleLogout, dark, setDark }) {
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayInitial = String(displayName).trim().charAt(0).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 -mx-4 w-[calc(100%+2rem)] bg-white shadow-md dark:bg-gray-800">
      <div className="px-4 py-5">
        <div className="flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgetwise</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 sm:gap-2" role="tablist" aria-label="App view">
              <Button
                variant="nav"
                active={view === DASHBOARD}
                onClick={() => setView(DASHBOARD)}
                role="tab"
                aria-selected={view === DASHBOARD}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-auto! sm:w-auto! sm:gap-2! sm:px-4! sm:py-2!"
              >
                <i className="fas fa-plus-circle" aria-hidden="true" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sr-only sm:hidden">Add Expense</span>
              </Button>
              <Button
                variant="nav"
                active={view === EXPENSES}
                onClick={() => setView(EXPENSES)}
                role="tab"
                aria-selected={view === EXPENSES}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-auto! sm:w-auto! sm:gap-2! sm:px-4! sm:py-2!"
              >
                <i className="fas fa-list" aria-hidden="true" />
                <span className="hidden sm:inline">Expenses</span>
                <span className="sr-only sm:hidden">Expenses</span>
              </Button>
              <Button
                variant="nav"
                active={view === ANALYTICS}
                onClick={() => setView(ANALYTICS)}
                role="tab"
                aria-selected={view === ANALYTICS}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-auto! sm:w-auto! sm:gap-2! sm:px-4! sm:py-2!"
              >
                <i className="fas fa-chart-line" aria-hidden="true" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sr-only sm:hidden">Analytics</span>
              </Button>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-200 p-0 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
              type="button"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-4 dark:border-gray-600">
              {user?.avatarDataUrl ? (
                <img
                  src={user.avatarDataUrl}
                  alt={`${displayName} profile`}
                  className="h-8 w-8 rounded-full border border-gray-300 object-cover dark:border-gray-600"
                />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {displayInitial}
                </span>
              )}

              <span className="text-sm text-gray-700 dark:text-gray-300">{displayName}</span>
              <button
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                type="button"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sr-only sm:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
