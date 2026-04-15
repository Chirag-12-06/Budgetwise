import { useEffect, useMemo, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

const calendarBaseClasses =
  "calendar-input w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const highlightStyleId = "bw-calendar-highlight-style";

const highlightStyleText = `
.flatpickr-day.has-expense {
  background: #4f46e5 !important;
  color: #fff !important;
  border-radius: 50%;
  font-weight: 700;
}

.flatpickr-day.has-expense:hover {
  background: #4338ca !important;
  color: #fff !important;
}
`;

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateKey(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return formatDateKey(parsedDate);
}

function extractExpenseDateKey(expense) {
  const source = expense?.createdAt ?? expense?.date;
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    const sourceDatePart = source.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(sourceDatePart)) {
      return sourceDatePart;
    }
  }

  return toLocalDateKey(source);
}

export default function Calendar({
  className = "",
  highlightDates = [],
  expenses = [],
  value = "",
  onChange,
  ...props
}) {
  const mergedHighlightDates = useMemo(() => {
    const explicitDates = Array.isArray(highlightDates)
      ? highlightDates.filter((dateKey) => Boolean(dateKey))
      : [];

    if (explicitDates.length > 0) {
      return Array.from(new Set(explicitDates));
    }

    if (!Array.isArray(expenses)) {
      return [];
    }

    return Array.from(new Set(expenses.map(extractExpenseDateKey).filter(Boolean)));
  }, [highlightDates, expenses]);

  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const highlightSetRef = useRef(new Set(mergedHighlightDates));
  const resolvedInputClasses = `${calendarBaseClasses} ${
    mergedHighlightDates.length ? "has-expenses" : ""
  } ${className}`.trim();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (document.getElementById(highlightStyleId)) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = highlightStyleId;
    styleElement.textContent = highlightStyleText;
    document.head.appendChild(styleElement);
  }, []);

  useEffect(() => {
    highlightSetRef.current = new Set(mergedHighlightDates);
    if (pickerRef.current) {
      pickerRef.current.redraw();
    }
  }, [mergedHighlightDates]);

  useEffect(() => {
    if (!inputRef.current) {
      return undefined;
    }

    const picker = flatpickr(inputRef.current, {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d-m-Y",
      altInputClass: resolvedInputClasses,
      disableMobile: true,
      allowInput: false, // Prevents keyboard from ever appearing
      defaultDate: value || undefined,
      onReady: (_selectedDates, _dateString, instance) => {
        if (instance.altInput) {
          instance.altInput.placeholder = "DD-MM-YYYY";
        }
      },
      onChange: (_selectedDates, dateString) => {
        if (typeof onChangeRef.current === "function") {
          onChangeRef.current({ target: { value: dateString } });
        }
      },
      onDayCreate: (_dateObject, _dateString, _instance, dayElement) => {
        const dateKey = formatDateKey(dayElement.dateObj);
        if (highlightSetRef.current.has(dateKey)) {
          dayElement.classList.add("has-expense");
        }
      },
    });

    pickerRef.current = picker;

    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) {
      return;
    }

    if (picker.altInput) {
      picker.altInput.className = resolvedInputClasses;
      picker.altInput.placeholder = "DD-MM-YYYY";
    } else {
      picker.input.className = resolvedInputClasses;
    }
  }, [resolvedInputClasses]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) {
      return;
    }

    if (!value) {
      if (picker.input.value) {
        picker.clear(false);
      }
      return;
    }

    if (picker.input.value !== value) {
      picker.setDate(value, false);
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="none"
      readOnly
      placeholder="DD-MM-YYYY"
      className={resolvedInputClasses}
      {...props}
    />
  );
}