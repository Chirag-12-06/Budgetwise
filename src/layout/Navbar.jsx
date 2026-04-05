import Button from "../components/button";

const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

export default function Navbar({ user, view, setView, handleLogout, dark, setDark }) {
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayInitial = String(displayName).trim().charAt(0).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 -mx-4 w-[calc(100%+2rem)] bg-white shadow-md dark:bg-gray-800">
      <div className="px-3 py-4 sm:px-4 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">Budgetwise</h1>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1" role="tablist" aria-label="App view">
              <Button
                variant="nav"
                active={view === DASHBOARD}
                onClick={() => setView(DASHBOARD)}
                role="tab"
                aria-selected={view === DASHBOARD}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-plus-circle" aria-hidden="true" />
                <span className="hidden md:inline">Add Expense</span>
                <span className="sr-only md:hidden">Add Expense</span>
              </Button>
              <Button
                variant="nav"
                active={view === EXPENSES}
                onClick={() => setView(EXPENSES)}
                role="tab"
                aria-selected={view === EXPENSES}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-list" aria-hidden="true" />
                <span className="hidden md:inline">Expenses</span>
                <span className="sr-only md:hidden">Expenses</span>
              </Button>
              <Button
                variant="nav"
                active={view === ANALYTICS}
                onClick={() => setView(ANALYTICS)}
                role="tab"
                aria-selected={view === ANALYTICS}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-chart-line" aria-hidden="true" />
                <span className="hidden md:inline">Analytics</span>
                <span className="sr-only md:hidden">Analytics</span>
              </Button>
            </div>

            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-200 p-0 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
              type="button"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            <div className="flex items-center gap-1.5 border-l border-gray-300 pl-2 sm:gap-2 sm:pl-3 dark:border-gray-600">
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

              <span className="hidden max-w-28 truncate text-sm text-gray-700 dark:text-gray-300 xl:inline">
                {displayName}
              </span>
              <button
                className="inline-flex items-center gap-1 px-1.5 py-1 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:px-2"
                type="button"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true" />
                <span className="hidden xl:inline">Logout</span>
                <span className="sr-only xl:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
