export default function SummaryCard({ title, value }) {
  return (
    <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
        {title}
      </p>

      <p className="mt-1 text-lg font-bold">{value}</p>
    </article>
  );
}