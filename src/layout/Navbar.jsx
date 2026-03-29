const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

const navLinkClasses =
  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors";
const activeLinkClasses = "bg-indigo-600 text-white shadow-sm";
const inactiveLinkClasses =
  "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";

export default function Navbar({ user, view, setView, handleLogout, dark, setDark }) {
  return (
    <nav className="sticky top-0 z-50 -mx-4 w-[calc(100%+2rem)] bg-white shadow-md dark:bg-gray-800">
      <div className="px-4 py-5">
        <div className="flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgetwise</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="App view">
              <button
                className={`${navLinkClasses} ${view === DASHBOARD ? activeLinkClasses : inactiveLinkClasses}`}
                type="button"
                onClick={() => setView(DASHBOARD)}
              >
                <i className="fas fa-plus-circle" aria-hidden="true" />
                Add Expense
              </button>
              <button
                className={`${navLinkClasses} ${view === EXPENSES ? activeLinkClasses : inactiveLinkClasses}`}
                type="button"
                onClick={() => setView(EXPENSES)}
              >
                <i className="fas fa-list" aria-hidden="true" />
                Expenses
              </button>
              <button
                className={`${navLinkClasses} ${view === ANALYTICS ? activeLinkClasses : inactiveLinkClasses}`}
                type="button"
                onClick={() => setView(ANALYTICS)}
              >
                <i className="fas fa-chart-line" aria-hidden="true" />
                Analytics
              </button>
            </div>

            <button
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              type="button"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-4 dark:border-gray-600">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user?.name || user?.email || "Budgetwise user"}
              </span>
              <button
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                type="button"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
