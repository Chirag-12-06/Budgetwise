export default function DateFilterSelector({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-xl border py-1.5 px-2 dark:border-gray-700 dark:bg-gray-900/40">
      {options.map((option, index) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              relative px-4 py-2 text-sm font-medium transition-all duration-200
              ${
                isSelected
                  ? "rounded-lg bg-indigo-600 text-white shadow-sm"
                  : "dark:text-gray-300 dark:hover:text-white"
              }
            `}
          >
            {option.label}

            {index !== options.length - 1 &&
              !isSelected &&
              value !== options[index + 1].value && (
                <span className="absolute right-0 top-1/2 h-4 -translate-y-1/2 border-r dark:border-gray-600" />
              )}
          </button>
        );
      })}
    </div>
  );
}
