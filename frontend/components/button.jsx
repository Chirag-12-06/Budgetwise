const baseButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900";
const plainBaseButtonClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900";

const variantClasses = {
  plain: "",
  filterIdle:
    "border border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
  filterActive: "bg-indigo-600 text-white",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
  navIdle:
    "border text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
  navActive: "bg-indigo-600 text-white shadow-sm",
  expenseEdit:
    "h-9 w-9 gap-0 rounded-md border border-transparent bg-emerald-600 px-0 py-0 text-white hover:bg-emerald-500",
  expenseDelete:
    "h-9 w-9 gap-0 rounded-md border border-transparent bg-red-500 px-0 py-0 text-white hover:bg-red-600",
};

export default function Button({
  children,
  type = "button",
  onClick,
  active = false,
  variant = "filter",
  className = "",
  ...rest
}) {
  let stateClasses = variantClasses.filterIdle;

  if (variant === "plain") {
    stateClasses = variantClasses.plain;
  } else if (variant === "outline") {
    stateClasses = variantClasses.outline;
  } else if (variant === "nav") {
    stateClasses = active ? variantClasses.navActive : variantClasses.navIdle;
  } else if (variant === "expenseEdit") {
    stateClasses = variantClasses.expenseEdit;
  } else if (variant === "expenseDelete") {
    stateClasses = variantClasses.expenseDelete;
  } else if (active) {
    stateClasses = variantClasses.filterActive;
  }

  const resolvedBaseClasses = variant === "plain" ? plainBaseButtonClasses : baseButtonClasses;

  return (
    <button
      className={`${resolvedBaseClasses} ${stateClasses} ${className}`.trim()}
      type={type}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}