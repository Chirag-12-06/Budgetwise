export default function StatusBanner({ status }) {
  if (!status) return null;

  const toneClasses = {
    error:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  const type = status.type === "error" ? "error" : "success";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg px-6 py-4 text-center font-semibold shadow-lg ${
        toneClasses[type]
      }`}
    >
      {status.message}
    </div>
  );
}