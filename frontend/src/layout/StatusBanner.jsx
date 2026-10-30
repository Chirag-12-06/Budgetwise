export default function StatusBanner({ status }) {
  if (!status) {
    return null;
  }

  const toneClasses =
  status.type === "error"
    ? "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl rounded-lg bg-red-100 px-6 py-4 text-center font-semibold text-red-800 shadow-lg dark:bg-red-900 dark:text-red-200"
    : "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl rounded-lg bg-green-100 px-6 py-4 text-center font-semibold text-green-800 shadow-lg dark:bg-green-900 dark:text-green-200";

  return (
    <div className={toneClasses}>{status.message}</div>
  );
}

