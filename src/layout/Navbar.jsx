const DASHBOARD = "dashboard";
const EXPENSES = "expenses";
const ANALYTICS = "analytics";

export default function Navbar({ user, view, setView, handleLogout }) {
  return (
    <div className="dashboard-head">
      <div>
        <p className="welcome-label">Welcome back</p>
        <h2>{user?.name || user?.email || "Budgetwise user"}</h2>
        <p className="subtle">The app now has a basic dashboard view and a dedicated expenses view.</p>
      </div>
      <div className="nav-actions">
        <div className="view-toggle" role="tablist" aria-label="App view">
          <button className={view === DASHBOARD ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setView(DASHBOARD)}>Dashboard</button>
          <button className={view === EXPENSES ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setView(EXPENSES)}>Expenses</button>
          <button className={view === ANALYTICS ? "mini-tab active" : "mini-tab"} type="button" onClick={() => setView(ANALYTICS)}>Analytics</button>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}
