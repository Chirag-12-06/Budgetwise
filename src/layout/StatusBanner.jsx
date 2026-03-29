export default function StatusBanner({ status }) {
  if (!status) {
    return null;
  }

  const toneClasses =
    status.type === "error"
      ? "mt-5 rounded-2xl bg-red-500/10 px-4 py-3.5 font-semibold text-red-800 dark:text-red-200"
      : "mt-5 rounded-2xl bg-green-500/10 px-4 py-3.5 font-semibold text-green-800 dark:text-green-200";

  return (
    <div className={toneClasses}>{status.message}</div>
  );
}
