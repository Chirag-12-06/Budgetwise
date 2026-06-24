const variantClasses = {
  default:
    "rounded-lg border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800",
  addExpense:
    "rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 dark:bg-slate-800/95 dark:ring-white/5 md:p-6",
};

export default function PanelCard({
  children,
  className = "",
  variant = "default",
  as: Component = "section",
}) {
  const resolvedVariant = variantClasses[variant] || variantClasses.default;

  return <Component className={`bw-panel-card ${resolvedVariant} ${className}`.trim()}>{children}</Component>;
}
