export default function PreferenceSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[0.92rem] font-semibold">{label}</span>

      <select
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const isObject = typeof option === "object";

          const optionValue = isObject ? option.value : option;
          const optionLabel = isObject ? option.label : option;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}