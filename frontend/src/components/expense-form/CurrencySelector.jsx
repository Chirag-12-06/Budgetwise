import { useEffect, useRef, useState } from "react";
import { CURRENCY_OPTIONS } from "../../constants/currencies";

export default function AmountCurrencyField({
  expenseForm,
  setExpenseForm,
  fieldClasses,
}) {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyDropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target)
      ) {
        setCurrencyOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const currentCurrency =
    CURRENCY_OPTIONS.find(
      (currency) => currency.code === (expenseForm.currencyCode || "INR"),
    ) || CURRENCY_OPTIONS[0];

  return (
    <div className="flex gap-2">
      <div className="relative w-36 shrink-0" ref={currencyDropdownRef}>
        <button
          type="button"
          className={`${fieldClasses} flex h-full w-full items-center justify-between gap-2`}
          onClick={() => setCurrencyOpen((previous) => !previous)}
        >
          <span className="flex items-center gap-4">
            <img
              src={currentCurrency.flag}
              alt={currentCurrency.name}
              className="h-6 w-10 rounded-sm object-cover"
            />
            <span>{currentCurrency.symbol}</span>
          </span>

          <i className="fas fa-chevron-down text-xs" />
        </button>

        {currencyOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-36 overflow-y-auto rounded-lg border bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
            {CURRENCY_OPTIONS.map((currency) => (
              <button
                key={currency.code}
                type="button"
                className="flex w-full items-center gap-6 px-3 py-2 text-left dark:text-white dark:hover:bg-gray-700"
                onClick={() => {
                  setExpenseForm((current) => ({
                    ...current,
                    currencyCode: currency.code,
                  }));

                  setCurrencyOpen(false);
                }}
              >
                <img
                  src={currency.flag}
                  alt={currency.name}
                  className="h-6 w-10 rounded-sm object-cover"
                />

                <span>{currency.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
