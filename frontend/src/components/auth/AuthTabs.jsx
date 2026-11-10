import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routes";

export default function AuthTabs({ activeTab }) {
  const navigate = useNavigate();

  const tabs = [
    { label: "Login", value: "login", route: ROUTES.LOGIN },
    { label: "Sign Up", value: "signup", route: ROUTES.SIGNUP },
  ];

  return (
    <div
      className="my-6 grid grid-cols-2 gap-3"
      role="tablist"
      aria-label="Authentication mode"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`rounded-md px-4 py-3 ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
            }`}
            onClick={() => navigate(tab.route)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}