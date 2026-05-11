import Button from "./button";

const scopeOptions = [
  {
    value: "single",
    title: "Only this expense",
    description: "Apply the change to the selected occurrence only.",
  },
  {
    value: "future",
    title: "This and future expenses",
    description: "Apply the change to this occurrence and all upcoming ones.",
  },
  {
    value: "series",
    title: "Entire series",
    description:
      "Apply the change to every occurrence in the recurring series.",
  },
];

export default function RecurringExpenseActionDialog({
  open,
  actionType,
  expenseTitle,
  onClose,
  onSelect,
}) {
  if (!open) {
    return null;
  }

  const isDeleteAction = actionType === "delete";
  const title = isDeleteAction
    ? "Delete recurring expense"
    : "Edit recurring expense";
  const verb = isDeleteAction ? "delete" : "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-expense-action-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="recurring-expense-action-dialog-title"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h3>
        <p className="mt-2 text-base text-gray-600 dark:text-slate-200">
          Choose what you want to {verb} for{" "}
          {expenseTitle || "this recurring expense"}.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          The buttons below are frontend-only for now. They will be connected to
          the backend actions later.
        </p>

        <div className="mt-5 grid gap-3">
          {scopeOptions.map((option) => (
            <Button
              key={option.value}
              variant="plain"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700/70 dark:hover:bg-slate-700"
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span className="grid gap-1 text-left">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {option.title}
                </span>
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {option.description}
                </span>
              </span>
            </Button>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="plain"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
