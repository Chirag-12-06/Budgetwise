import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { formatCurrency } from "../lib/api";
import { CATEGORY_COLORS, getCategoryDisplay } from "../lib/categoryConfig";
import DateFilterPanel from "../components/dateFilterPanel";

const panelCardClasses =
  "rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800";

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(107, 114, 128, ${alpha})`;
  }

  const normalized =
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getContrastTextColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return "#ffffff";
  }

  const normalized =
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 160 ? "#111827" : "#ffffff";
}

function createSeededRandom(seedInput) {
  let seed = 0;
  for (let index = 0; index < seedInput.length; index += 1) {
    seed = (seed * 31 + seedInput.charCodeAt(index)) % 2147483647;
  }

  if (seed <= 0) {
    seed += 2147483646;
  }

  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function detectOutliers(data) {
  const values = data
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return { outliers: [], upperBound: null, lowerBound: null, hasOutliers: false };
  }

  if (values.length <= 3) {
    const sorted = [...values].sort((left, right) => left - right);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;

    if (min > 0 && max / min > 10) {
      return {
        outliers: [max],
        upperBound: min * 10,
        lowerBound: 0,
        hasOutliers: true,
      };
    }

    if (min > 0 && range > min * 5) {
      return {
        outliers: [max],
        upperBound: min * 5,
        lowerBound: 0,
        hasOutliers: true,
      };
    }

    return {
      outliers: [],
      upperBound: max,
      lowerBound: min,
      hasOutliers: false,
    };
  }

  const sorted = [...values].sort((left, right) => left - right);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter((value) => value < lowerBound || value > upperBound);

  return {
    outliers,
    upperBound,
    lowerBound,
    hasOutliers: outliers.length > 0,
  };
}

function isWithinOutlierBounds(value, outlierInfo) {
  if (!outlierInfo?.hasOutliers) return true;
  return value >= outlierInfo.lowerBound && value <= outlierInfo.upperBound;
}

function buildBubbleLayout(categories, width, height, totalAmount, useLogScale) {
  if (!categories.length || width <= 0 || height <= 0 || totalAmount <= 0) {
    return [];
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const scaleValue = (value) => {
    const numeric = Number(value || 0);
    if (useLogScale) {
      return Math.log10(Math.max(0, numeric) + 1);
    }
    return numeric;
  };

  const edgePadding = 8;
  const titleSafeTop = 40;
  const plotWidth = Math.max(120, width - edgePadding * 2);
  const plotHeight = Math.max(120, height - titleSafeTop - edgePadding);
  const area = plotWidth * plotHeight;
  const scaledMaxValue = Math.max(...categories.map(([, value]) => scaleValue(value)), 1);
  const targetPerBubble = area / Math.max(categories.length, 1);
  const maxBubbleDiameter = Math.max(34, Math.min(178, Math.sqrt(targetPerBubble) * 1.45));
  const minBubbleDiameter = useLogScale
    ? Math.max(14, Math.min(52, maxBubbleDiameter * 0.28))
    : Math.max(20, Math.min(64, maxBubbleDiameter * 0.34));

  const centerX = width / 2;
  const centerY = titleSafeTop + plotHeight / 2;
  const maxSearchRadius = Math.max(plotWidth, plotHeight) * 0.75;
  const placed = [];

  const withinBounds = (x, y, radius) =>
    x >= edgePadding + radius
    && x <= width - edgePadding - radius
    && y >= titleSafeTop + radius
    && y <= height - edgePadding - radius;

  const overlapsPlaced = (x, y, radius) =>
    placed.some((point) => {
      const dx = x - point.x;
      const dy = y - point.y;
      const minDistance = radius + point.r + 4;
      return dx * dx + dy * dy < minDistance * minDistance;
    });

  const bubbles = categories.map(([categoryKey, value], index) => {
    const numericValue = Number(value || 0);
    const scaledValue = scaleValue(numericValue);
    const relative = scaledMaxValue > 0 ? Math.sqrt(scaledValue / scaledMaxValue) : 0;
    const diameter = Math.max(
      minBubbleDiameter,
      Math.min(maxBubbleDiameter, minBubbleDiameter + relative * (maxBubbleDiameter - minBubbleDiameter)),
    );

    const radius = diameter / 2;
    const random = createSeededRandom(categoryKey);
    let x = centerX;
    let y = centerY;
    let foundSpot = false;

    if (index === 0 && withinBounds(x, y, radius)) {
      foundSpot = true;
    }

    for (let ring = 0; !foundSpot && ring <= 30; ring += 1) {
      const ringDistance = (ring / 30) * maxSearchRadius;
      const attempts = 22;
      for (let step = 0; step < attempts; step += 1) {
        const angle = (Math.PI * 2 * step) / attempts + random() * 0.35;
        const candidateX = centerX + Math.cos(angle) * ringDistance;
        const candidateY = centerY + Math.sin(angle) * ringDistance;
        if (!withinBounds(candidateX, candidateY, radius)) continue;
        if (overlapsPlaced(candidateX, candidateY, radius)) continue;
        x = candidateX;
        y = candidateY;
        foundSpot = true;
        break;
      }
    }

    if (!foundSpot) {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const candidateX =
          edgePadding + radius + random() * Math.max(1, width - edgePadding * 2 - radius * 2);
        const candidateY =
          titleSafeTop + radius + random() * Math.max(1, height - titleSafeTop - edgePadding - radius * 2);
        if (!withinBounds(candidateX, candidateY, radius)) continue;
        if (overlapsPlaced(candidateX, candidateY, radius)) continue;
        x = candidateX;
        y = candidateY;
        foundSpot = true;
        break;
      }
    }

    if (!foundSpot) {
      x = edgePadding + radius + random() * Math.max(1, width - edgePadding * 2 - radius * 2);
      y = titleSafeTop + radius + random() * Math.max(1, height - titleSafeTop - edgePadding - radius * 2);
    }

    placed.push({ x, y, r: radius });

    return {
      categoryKey,
      value: numericValue,
      percent: (numericValue / totalAmount) * 100,
      x,
      y,
      r: radius,
      diameter,
      animationDuration: (6 + random() * 6).toFixed(2),
      animationDelay: (-random() * 6).toFixed(2),
    };
  });

  for (let iteration = 0; iteration < 120; iteration += 1) {
    let moved = false;

    for (let i = 0; i < bubbles.length; i += 1) {
      for (let j = i + 1; j < bubbles.length; j += 1) {
        const bubbleA = bubbles[i];
        const bubbleB = bubbles[j];
        const dx = bubbleB.x - bubbleA.x;
        const dy = bubbleB.y - bubbleA.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = bubbleA.r + bubbleB.r + 2;

        if (distance >= minDistance) continue;

        const normX = distance === 0 ? 1 : dx / distance;
        const normY = distance === 0 ? 0 : dy / distance;
        const overlap = (minDistance - Math.max(distance, 0.0001)) / 2;

        bubbleA.x -= normX * overlap;
        bubbleA.y -= normY * overlap;
        bubbleB.x += normX * overlap;
        bubbleB.y += normY * overlap;
        moved = true;
      }
    }

    for (const bubble of bubbles) {
      bubble.x = clamp(bubble.x, edgePadding + bubble.r, width - edgePadding - bubble.r);
      bubble.y = clamp(bubble.y, titleSafeTop + bubble.r, height - edgePadding - bubble.r);
    }

    if (!moved) {
      break;
    }
  }

  return bubbles.map(({ r, ...bubble }) => bubble);
}

export default function AnalyticsPage({
  expenses,
  dateFilterMode,
  setDateFilterMode,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  applyCustomDateRange,
  dateRangeError,
  analyticsTotal,
  categoryTotals,
  analyticsExpenses,
  analyticsGroupBy,
  setAnalyticsGroupBy,
  trendData,
}) {
  const lineCanvasRef = useRef(null);
  const lineChartRef = useRef(null);
  const bubbleBoardRef = useRef(null);
  const [bubbleBoardSize, setBubbleBoardSize] = useState({ width: 0, height: 0 });
  const [hiddenBubbleCategories, setHiddenBubbleCategories] = useState([]);
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [useLogScale, setUseLogScale] = useState(false);

  const isDarkMode =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const trendPoints = useMemo(
    () =>
      (trendData || [])
        .map((point) => ({
          label: point.label,
          value: Number(point.value || 0),
        }))
        .filter((point) => Number.isFinite(point.value) && point.value >= 0),
    [trendData],
  );

  const trendOutlierInfo = useMemo(
    () => detectOutliers(trendPoints.map((point) => point.value)),
    [trendPoints],
  );

  const visibleTrendPoints = useMemo(() => {
    if (!excludeOutliers || !trendOutlierInfo.hasOutliers) {
      return trendPoints;
    }

    return trendPoints.filter((point) => isWithinOutlierBounds(point.value, trendOutlierInfo));
  }, [trendPoints, excludeOutliers, trendOutlierInfo]);

  const expenseAmountOutlierInfo = useMemo(
    () => detectOutliers(analyticsExpenses.map((expense) => Number(expense.amount || 0))),
    [analyticsExpenses],
  );

  const displayedAnalyticsExpenses = useMemo(() => {
    if (!excludeOutliers || !expenseAmountOutlierInfo.hasOutliers) {
      return analyticsExpenses;
    }

    return analyticsExpenses.filter((expense) => {
      const amount = Number(expense.amount || 0);
      return isWithinOutlierBounds(amount, expenseAmountOutlierInfo);
    });
  }, [analyticsExpenses, excludeOutliers, expenseAmountOutlierInfo]);

  const displayedAnalyticsTotal = useMemo(
    () => displayedAnalyticsExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [displayedAnalyticsExpenses],
  );

  const rawCategoryEntries = useMemo(
    () =>
      Object.entries(categoryTotals || {})
        .map(([key, value]) => [key, Number(value || 0)])
        .filter(([, value]) => value > 0)
        .sort((left, right) => right[1] - left[1]),
    [categoryTotals],
  );

  const categoryOutlierInfo = useMemo(
    () => detectOutliers(rawCategoryEntries.map(([, value]) => value)),
    [rawCategoryEntries],
  );

  const chartCategories = useMemo(() => {
    if (
      excludeOutliers
      && rawCategoryEntries.length >= 3
      && categoryOutlierInfo.hasOutliers
    ) {
      const upperBound = Number(categoryOutlierInfo.upperBound);
      if (!Number.isFinite(upperBound)) {
        return rawCategoryEntries;
      }

      const highestCategoryValue = Number(rawCategoryEntries[0]?.[1] || 0);
      const secondHighestCategoryValue = Number(rawCategoryEntries[1]?.[1] || 0);
      const extremeHighCutoff = Math.max(
        upperBound * 2,
        secondHighestCategoryValue > 0 ? secondHighestCategoryValue * 4 : upperBound * 2,
      );

      // Keep regular categories visible and only hide very large spikes.
      if (highestCategoryValue <= extremeHighCutoff) {
        return rawCategoryEntries;
      }

      return rawCategoryEntries.filter(([, value]) => Number(value) <= extremeHighCutoff);
    }

    return rawCategoryEntries;
  }, [rawCategoryEntries, excludeOutliers, categoryOutlierInfo]);

  const totalCategoryAmount = useMemo(
    () => chartCategories.reduce((sum, [, value]) => sum + value, 0),
    [chartCategories],
  );

  const visibleCategories = useMemo(
    () => chartCategories.filter(([key]) => !hiddenBubbleCategories.includes(key)),
    [chartCategories, hiddenBubbleCategories],
  );

  const bubbleLayout = useMemo(
    () =>
      buildBubbleLayout(
        visibleCategories,
        bubbleBoardSize.width,
        bubbleBoardSize.height,
        totalCategoryAmount,
        false,
      ),
    [visibleCategories, bubbleBoardSize, totalCategoryAmount],
  );

  const outlierWarningText = useMemo(() => {
    if (excludeOutliers || !trendOutlierInfo.hasOutliers || !trendPoints.length) {
      return "";
    }

    const maxOutlier = Math.max(...trendOutlierInfo.outliers);
    const count = trendOutlierInfo.outliers.length;
    return `Found ${count} outlier value${count > 1 ? "s" : ""} out of ${trendPoints.length} data points. Highest outlier: ${formatCurrency(maxOutlier)}. This may affect chart readability.`;
  }, [excludeOutliers, trendOutlierInfo, trendPoints]);

  useEffect(() => {
    const board = bubbleBoardRef.current;
    if (!board) {
      return undefined;
    }

    const updateSize = () => {
      setBubbleBoardSize({
        width: Math.round(board.clientWidth),
        height: Math.round(board.clientHeight),
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(board);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) {
      return undefined;
    }

    if (lineChartRef.current) {
      lineChartRef.current.destroy();
      lineChartRef.current = null;
    }

    if (!visibleTrendPoints.length) {
      return undefined;
    }

    const labels = visibleTrendPoints.map((point) => point.label);
    const rawValues = visibleTrendPoints.map((point) => Number(point.value || 0));
    const values = useLogScale
      ? rawValues.map((value) => (value <= 0 ? 0.01 : value))
      : rawValues;

    let chartTitle = "Expense Trend";
    if (analyticsGroupBy === "daily") chartTitle = "Daily Expense Trend";
    else if (analyticsGroupBy === "monthly") chartTitle = "Monthly Expense Trend";
    else if (analyticsGroupBy === "yearly") chartTitle = "Yearly Expense Trend";

    const textColor = isDarkMode ? "#e5e7eb" : "#111827";
    const gridColor = isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(0, 0, 0, 0.1)";
    const lineColor = isDarkMode ? "#818cf8" : "#4f46e5";
    const maxAmount = Math.max(...values);
    const minPositiveAmount = values.reduce(
      (min, value) => (value > 0 && value < min ? value : min),
      Number.POSITIVE_INFINITY,
    );
    const logScaleMin = Number.isFinite(minPositiveAmount) ? minPositiveAmount : 0.01;

    lineChartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${analyticsGroupBy.charAt(0).toUpperCase() + analyticsGroupBy.slice(1)} Spending`,
            data: values,
            borderColor: lineColor,
            backgroundColor: isDarkMode ? "rgba(129, 140, 248, 0.15)" : "rgba(79, 70, 229, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: lineColor,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: chartTitle,
            color: textColor,
            font: { size: 16, weight: "bold" },
          },
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context) => {
                const originalValue = rawValues[context.dataIndex] ?? context.parsed.y;
                return `Amount: ${formatCurrency(originalValue)}`;
              },
            },
          },
        },
        interaction: {
          intersect: false,
        },
        scales: {
          y: {
            type: useLogScale ? "logarithmic" : "linear",
            beginAtZero: !useLogScale,
            ...(useLogScale
              ? {
                suggestedMax: maxAmount,
                min: logScaleMin,
                afterBuildTicks: (scale) => {
                  if (!scale.ticks.some((tick) => tick.value === maxAmount)) {
                    scale.ticks.push({ value: maxAmount });
                    scale.ticks.sort((left, right) => left.value - right.value);
                  }

                  if (scale.ticks.length > 10) {
                    const first = scale.ticks[0];
                    const last = scale.ticks[scale.ticks.length - 1];
                    const step = Math.ceil((scale.ticks.length - 2) / 8);
                    const middle = scale.ticks
                      .slice(1, -1)
                      .filter((_, index) => index % step === 0)
                      .slice(0, 8);
                    scale.ticks = [first, ...middle, last];
                  }
                },
              }
              : {}),
            ticks: {
              color: textColor,
              callback: (value) => {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) {
                  return "";
                }

                if (useLogScale) {
                  const logValue = Math.log10(numericValue);
                  const isPowerOfTen = Math.abs(logValue - Math.round(logValue)) < 1e-8;
                  const isMinValue =
                    Math.abs(numericValue - logScaleMin) <= Math.max(1, logScaleMin) * 1e-8;
                  const isMaxValue =
                    Math.abs(numericValue - maxAmount) <= Math.max(1, maxAmount) * 1e-8;

                  if (!isPowerOfTen && !isMinValue && !isMaxValue) {
                    return "";
                  }
                }

                return formatCurrency(numericValue);
              },
              maxTicksLimit: useLogScale ? 8 : 8,
              autoSkip: true,
            },
            grid: {
              color: gridColor,
            },
          },
          x: {
            offset: true,
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      if (lineChartRef.current) {
        lineChartRef.current.destroy();
        lineChartRef.current = null;
      }
    };
  }, [visibleTrendPoints, analyticsGroupBy, isDarkMode, useLogScale]);

  useEffect(() => {
    setHiddenBubbleCategories((current) =>
      current.filter((categoryKey) => chartCategories.some(([key]) => key === categoryKey)),
    );
  }, [chartCategories]);

  function toggleBubbleCategory(categoryKey) {
    setHiddenBubbleCategories((current) =>
      current.includes(categoryKey)
        ? current.filter((value) => value !== categoryKey)
        : [...current, categoryKey],
    );
  }

  function resetChartOptions() {
    setExcludeOutliers(false);
    setUseLogScale(false);
  }

  function handleQuickDateMode(mode) {
    resetChartOptions();
    setDateFilterMode(mode);
  }

  function handleApplyDateRange() {
    resetChartOptions();
    applyCustomDateRange();
  }

  return (
    <section className="grid gap-4">
      <section className={panelCardClasses}>
        <DateFilterPanel
          className="grid gap-4"
          expenses={expenses}
          dateFilterMode={dateFilterMode}
          onDateFilterModeChange={handleQuickDateMode}
          customDateFrom={customDateFrom}
          onCustomDateFromChange={setCustomDateFrom}
          customDateTo={customDateTo}
          onCustomDateToChange={setCustomDateTo}
          onApplyDateRange={handleApplyDateRange}
          dateRangeError={dateRangeError}
          summaryExpenses={displayedAnalyticsExpenses}
          summaryTotalSpending={
            excludeOutliers ? formatCurrency(displayedAnalyticsTotal) : formatCurrency(analyticsTotal)
          }
          summaryTrackedCategories={chartCategories.length}
          summaryVisibleEntries={displayedAnalyticsExpenses.length}
        />
      </section>

      <section className={panelCardClasses}>
        <div className="flex w-full justify-end">
          <div className="flex flex-wrap items-center rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-900/40">
              <label className="flex cursor-pointer items-center gap-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  checked={excludeOutliers}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  type="checkbox"
                  onChange={(event) => setExcludeOutliers(event.target.checked)}
                />
                Exclude Outliers
              </label>
              <label className="flex cursor-pointer items-center gap-2 border-l border-gray-300 px-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
                <input
                  checked={useLogScale}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  type="checkbox"
                  onChange={(event) => setUseLogScale(event.target.checked)}
                />
                Log Scale
              </label>
          </div>
        </div>

        {outlierWarningText ? (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/25">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Outliers Detected</h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">{outlierWarningText}</p>
            <p className="mt-2 text-xs text-yellow-700/90 dark:text-yellow-500">
              Tip: Enable Exclude Outliers or Log Scale for better visualization.
            </p>
          </div>
        ) : null}

        {visibleTrendPoints.length ? (
          <div className="h-96 pt-4">
            <canvas ref={lineCanvasRef} />
          </div>
        ) : (
          <div className="py-6 text-gray-500 dark:text-gray-300">
            No analytics data available for the selected range.
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
          </div>

          {chartCategories.length ? (
            <div className="pt-3">
              <div
                className="relative h-96 w-full overflow-hidden rounded-2xl"
                ref={bubbleBoardRef}
              >
                <div
                  className="pointer-events-none absolute left-4 top-3 text-sm font-semibold tracking-wide"
                  style={{ color: isDarkMode ? "#e5e7eb" : "#1f2937" }}
                >
                  Category Share
                </div>

                {visibleCategories.length ? (
                  bubbleLayout.map((bubble) => {
                    const categoryDisplay = getCategoryDisplay(bubble.categoryKey);
                    const bubbleColor =
                      CATEGORY_COLORS[bubble.categoryKey] || CATEGORY_COLORS.uncategorized;
                    const textColor = getContrastTextColor(bubbleColor);
                    const badgeFontSize =
                      bubble.diameter > 160 ? "2.2rem" : bubble.diameter > 110 ? "1.5rem" : "1rem";

                    return (
                      <div
                        className="floating-bubble absolute flex items-center justify-center rounded-full text-center"
                        key={bubble.categoryKey}
                        style={{
                          left: `${Math.round(bubble.x)}px`,
                          top: `${Math.round(bubble.y)}px`,
                          width: `${Math.round(bubble.diameter)}px`,
                          height: `${Math.round(bubble.diameter)}px`,
                          backgroundColor: bubbleColor,
                          border: `2px solid ${hexToRgba(bubbleColor, 0.95)}`,
                          color: textColor,
                          animationDuration: `${bubble.animationDuration}s`,
                          animationDelay: `${bubble.animationDelay}s`,
                        }}
                        title={`${categoryDisplay.label}: ${formatCurrency(bubble.value)} (${bubble.percent.toFixed(1)}%)`}
                      >
                        <span
                          className="pointer-events-none w-full px-2 font-bold leading-none"
                          style={{ fontSize: badgeFontSize }}
                        >
                          {bubble.percent.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                    All categories are hidden. Click a category in the legend to show it again.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">
              No category data available for the selected range.
            </div>
          )}
        </section>

        <section className={panelCardClasses}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div>
              <h3>Category Breakdown</h3>
            </div>
          </div>

          {chartCategories.length ? (
            <div className="max-h-96 overflow-y-auto pr-1 hide-scrollbar">
              <div className="grid gap-3">
                {chartCategories.map(([categoryKey, total]) => {
                  const category = getCategoryDisplay(categoryKey);
                  const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.uncategorized;
                  const percent = totalCategoryAmount ? (total / totalCategoryAmount) * 100 : 0;
                  const isHidden = hiddenBubbleCategories.includes(categoryKey);

                  return (
                    <button
                      className={`grid gap-2 rounded-lg p-2 text-left transition-colors ${
                        isHidden
                          ? "opacity-45"
                          : "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      key={categoryKey}
                      type="button"
                      onClick={() => toggleBubbleCategory(categoryKey)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: color }}
                          >
                            <i className={category.icon} aria-hidden="true" />
                          </span>
                          <strong className="truncate">{category.label}</strong>
                        </div>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <div className="h-[0.7rem] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-[inherit]"
                          style={{ width: `${percent}%`, backgroundColor: color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-gray-500 dark:text-gray-300">No category data available yet.</div>
          )}
        </section>
      </div>
    </section>
  );
}
