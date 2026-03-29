const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

const baseTabClasses =
  "rounded-full border border-slate-400/35 px-4 py-2.5 font-semibold text-inherit transition-colors";
const activeTabClasses = "bg-blue-600 text-white border-blue-600";
const inactiveTabClasses = "bg-transparent hover:bg-slate-400/10";

export default function Navbar({ user, view, setView, handleLogout }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
      <div>
        <p className="text-[0.92rem] font-semibold">Welcome back</p>
        <h2 className="m-0 leading-none">{user?.name || user?.email || "Budgetwise user"}</h2>
        <p className="text-slate-500 dark:text-slate-300">
          The app now has a basic dashboard view and a dedicated expenses view.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto" role="tablist" aria-label="App view">
          <button
            className={`${baseTabClasses} ${view === DASHBOARD ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setView(DASHBOARD)}
          >
            Dashboard
          </button>
          <button
            className={`${baseTabClasses} ${view === EXPENSES ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setView(EXPENSES)}
          >
            Expenses
          </button>
          <button
            className={`${baseTabClasses} ${view === ANALYTICS ? activeTabClasses : inactiveTabClasses}`}
            type="button"
            onClick={() => setView(ANALYTICS)}
          >
            Analytics
          </button>
        </div>
        <button
          className="rounded-2xl border border-slate-400/35 bg-transparent px-4 py-4 font-bold text-inherit"
          type="button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
