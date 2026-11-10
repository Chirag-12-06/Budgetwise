export default function Header() {
  return (
    <header className="pt-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">
        Welcome to
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 dark:text-white">
        Budgetwise
      </h1>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Track every rupee, every day.
      </p>
    </header>
  );
}
