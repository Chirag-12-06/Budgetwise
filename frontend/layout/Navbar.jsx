import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/button";
import { ROUTES } from "../lib/routes";

export default function Navbar({ user, handleLogout, dark, setDark }) {
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayInitial = String(displayName).trim().charAt(0).toUpperCase() || "U";
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="app-navbar sticky top-0 z-50 -mx-4 w-[calc(100%+2rem)] bg-white shadow-md dark:bg-gray-800">
      <div className="app-navbar-inner px-3 py-4 sm:px-4 sm:py-5">
        <div className="app-navbar-row flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="app-navbar-title truncate text-2xl font-bold text-gray-900 dark:text-white">Budgetwise</h1>
          </div>

          <div className="app-navbar-actions ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="app-navbar-tabs flex items-center gap-1" role="tablist" aria-label="App view">
              <Button
                variant="nav"
                active={location.pathname === ROUTES.HOME}
                onClick={() => navigate(ROUTES.HOME)}
                role="tab"
                aria-selected={location.pathname === ROUTES.HOME}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-plus-circle" aria-hidden="true" />
                <span className="hidden md:inline">Add Expense</span>
                <span className="sr-only md:hidden">Add Expense</span>
              </Button>
              <Button
                variant="nav"
                active={location.pathname === ROUTES.EXPENSES}
                onClick={() => navigate(ROUTES.EXPENSES)}
                role="tab"
                aria-selected={location.pathname === ROUTES.EXPENSES}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-list" aria-hidden="true" />
                <span className="hidden md:inline">Expenses</span>
                <span className="sr-only md:hidden">Expenses</span>
              </Button>
              <Button
                variant="nav"
                active={location.pathname === ROUTES.ANALYTICS}
                onClick={() => navigate(ROUTES.ANALYTICS)}
                role="tab"
                aria-selected={location.pathname === ROUTES.ANALYTICS}
                className="h-9! w-9! gap-0! px-0! py-0! sm:h-9! sm:w-9! sm:gap-0! sm:px-0! sm:py-0! md:h-auto! md:w-auto! md:gap-2! md:px-3! md:py-2!"
              >
                <i className="fas fa-chart-line" aria-hidden="true" />
                <span className="hidden md:inline">Analytics</span>
                <span className="sr-only md:hidden">Analytics</span>
              </Button>
            </div>

            <button
              className="app-navbar-theme-btn inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-200 p-0 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
              type="button"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            <div className="app-navbar-profile-group flex items-center gap-1.5 border-l border-gray-300 pl-2 sm:gap-2 sm:pl-3 dark:border-gray-600">
              <Button
                variant="plain"
                aria-label="Open profile"
                title="Open profile"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition ${
                  location.pathname === ROUTES.PROFILE
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
                    : "hover:ring-2 hover:ring-indigo-400/70"
                }`}
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
              >
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
              </Button>

              <span className="hidden max-w-28 truncate text-sm text-gray-700 dark:text-gray-300 xl:inline">
                {displayName}
              </span>
              <button
                className="app-navbar-logout inline-flex items-center gap-1 px-1.5 py-1 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:px-2"
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
