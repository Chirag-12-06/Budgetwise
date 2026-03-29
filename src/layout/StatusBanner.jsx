export default function StatusBanner({ status }) {
  if (!status) {
    return null;
  }

  const toneClasses =
    status.type === "error"
      ? "mt-5 rounded-lg bg-red-100 px-4 py-3 font-semibold text-red-800 dark:bg-red-900 dark:text-red-200"
      : "mt-5 rounded-lg bg-green-100 px-4 py-3 font-semibold text-green-800 dark:bg-green-900 dark:text-green-200";

  return (
    <div className={toneClasses}>{status.message}</div>
  );
}
