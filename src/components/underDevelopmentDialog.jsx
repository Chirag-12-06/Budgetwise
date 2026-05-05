import Button from "./button";

export default function UnderDevelopmentDialog({
  open,
  title,
  message,
  onClose,
  labelledBy,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id={labelledBy}
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h3>
        <p className="mt-2 text-base text-gray-600 dark:text-slate-200">
          {message}
        </p>
        <div className="mt-5 flex justify-end">
          <Button
            variant="plain"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            type="button"
            onClick={onClose}
          >
            Okay
          </Button>
        </div>
      </div>
    </div>
  );
}
