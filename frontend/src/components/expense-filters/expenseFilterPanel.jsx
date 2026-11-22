import DateFilterPanel from "./DateFilterPanel";
import CategoryFilterPanel from "./CategoryFilterPanel";

export default function ExpenseFilterPanel({ className = "mb-5 grid gap-4" }) {
  return (
    <div className={className}>
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr] xl:items-stretch">
        <DateFilterPanel />
        <CategoryFilterPanel />
      </div>
    </div>
  );
}
