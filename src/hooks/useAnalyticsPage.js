import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { formatCurrency } from "../lib/api";

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

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTextSafeBubbleDiameter(width) {
  if (width <= 360) {
    return 54;
  }

  if (width <= 520) {
    return 58;
  }

  return 62;
}

function calculateCategoryPanelsHeight(width, categoryCount) {
  const fallbackHeight = 384;
  if (width <= 0 || categoryCount <= 0) {
    return fallbackHeight;
  }

  const edgePadding = 8;
  const titleSafeTop = 40;
  const plotWidth = Math.max(120, width - edgePadding * 2);
  const minBubbleDiameter = getTextSafeBubbleDiameter(width);
  const bubbleArea = Math.PI * (minBubbleDiameter / 2) ** 2;
  const packingEfficiency = width <= 420 ? 0.52 : width <= 640 ? 0.56 : 0.6;
  const requiredPlotArea = (bubbleArea * categoryCount) / packingEfficiency;
  const requiredPlotHeight = requiredPlotArea / plotWidth;
  const baseHeight = width <= 420 ? 420 : fallbackHeight;
  const maxHeight = width <= 420 ? 860 : 760;

  return clampNumber(
    Math.ceil(titleSafeTop + edgePadding + requiredPlotHeight),
    baseHeight,
    maxHeight,
  );
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
  const textSafeBubbleDiameter = getTextSafeBubbleDiameter(width);
  const targetPerBubble = area / Math.max(categories.length, 1);
  const widthDensityScale =
    width <= 360 ? 0.58 : width <= 420 ? 0.68 : width <= 520 ? 0.78 : width <= 700 ? 0.88 : 1;
  const countDensityScale =
    categories.length >= 10
      ? 0.84
      : categories.length >= 8
        ? 0.9
        : categories.length >= 6
          ? 0.95
          : 1;
  let maxBubbleDiameter = Math.max(
    30,
    Math.min(178, Math.sqrt(targetPerBubble) * 1.45 * widthDensityScale * countDensityScale),
  );
  let minBubbleDiameter = useLogScale
    ? Math.max(12, Math.min(46, maxBubbleDiameter * 0.28))
    : Math.max(16, Math.min(56, maxBubbleDiameter * 0.34));
  minBubbleDiameter = Math.max(minBubbleDiameter, textSafeBubbleDiameter);

  const estimatedBubbleCoverage = categories.reduce((sum, [, value]) => {
    const numericValue = Number(value || 0);
    const scaledValue = scaleValue(numericValue);
    const relative = scaledMaxValue > 0 ? Math.sqrt(scaledValue / scaledMaxValue) : 0;
    const estimatedDiameter = Math.max(
      minBubbleDiameter,
      Math.min(maxBubbleDiameter, minBubbleDiameter + relative * (maxBubbleDiameter - minBubbleDiameter)),
    );
    const estimatedRadius = estimatedDiameter / 2;
    return sum + Math.PI * estimatedRadius * estimatedRadius;
  }, 0);
  const maxCoverageRatio =
    width <= 420 ? 0.42 : width <= 520 ? 0.46 : width <= 700 ? 0.52 : 0.56;
  const maxBubbleCoverage = area * maxCoverageRatio;
  if (estimatedBubbleCoverage > maxBubbleCoverage && estimatedBubbleCoverage > 0) {
    const shrinkScale = Math.sqrt(maxBubbleCoverage / estimatedBubbleCoverage);
    maxBubbleDiameter = Math.max(textSafeBubbleDiameter, maxBubbleDiameter * shrinkScale);
    minBubbleDiameter = Math.max(textSafeBubbleDiameter, minBubbleDiameter * shrinkScale);
  }

  if (maxBubbleDiameter < minBubbleDiameter) {
    maxBubbleDiameter = minBubbleDiameter;
  }

  const centerX = width / 2;
  const centerY = titleSafeTop + plotHeight / 2;
  const maxSearchRadius = Math.max(plotWidth, plotHeight) * 0.75;
  const placed = [];
  const initialBubbleGap = width <= 420 ? 1 : width <= 640 ? 2 : 4;
  const simulationBubbleGap = width <= 420 ? 0.8 : width <= 640 ? 1.2 : 2;

  const withinBounds = (x, y, radius) =>
    x >= edgePadding + radius
    && x <= width - edgePadding - radius
    && y >= titleSafeTop + radius
    && y <= height - edgePadding - radius;

  const overlapsPlaced = (x, y, radius, gap = initialBubbleGap) =>
    placed.some((point) => {
      const dx = x - point.x;
      const dy = y - point.y;
      const minDistance = radius + point.r + gap;
      return dx * dx + dy * dy < minDistance * minDistance;
    });

  const separateBubbles = (items, gap, iterations = 120) => {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let moved = false;

      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const bubbleA = items[i];
          const bubbleB = items[j];
          const dx = bubbleB.x - bubbleA.x;
          const dy = bubbleB.y - bubbleA.y;
          const distance = Math.hypot(dx, dy);
          const minDistance = bubbleA.r + bubbleB.r + gap;

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

      for (const bubble of items) {
        bubble.x = clamp(bubble.x, edgePadding + bubble.r, width - edgePadding - bubble.r);
        bubble.y = clamp(bubble.y, titleSafeTop + bubble.r, height - edgePadding - bubble.r);
      }

      if (!moved) {
        break;
      }
    }
  };

  const hasOverlap = (items, gap) =>
    items.some((bubbleA, i) =>
      items.slice(i + 1).some((bubbleB) => {
        const distance = Math.hypot(bubbleB.x - bubbleA.x, bubbleB.y - bubbleA.y);
        return distance < bubbleA.r + bubbleB.r + gap;
      }),
    );

  const bubbles = categories.map(([categoryKey, value], index) => {
    const numericValue = Number(value || 0);
    const scaledValue = scaleValue(numericValue);
    const relative = scaledMaxValue > 0 ? Math.sqrt(scaledValue / scaledMaxValue) : 0;
    const baseDiameter = Math.max(
      minBubbleDiameter,
      Math.min(maxBubbleDiameter, minBubbleDiameter + relative * (maxBubbleDiameter - minBubbleDiameter)),
    );

    let radius = baseDiameter / 2;
    const minimumRadius = textSafeBubbleDiameter / 2;
    const random = createSeededRandom(categoryKey);
    let x = centerX;
    let y = centerY;
    let foundSpot = false;

    while (!foundSpot && radius >= minimumRadius) {
      if (index === 0 && withinBounds(centerX, centerY, radius) && !overlapsPlaced(centerX, centerY, radius)) {
        x = centerX;
        y = centerY;
        foundSpot = true;
        break;
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
        radius *= 0.9;
      }
    }

    if (!foundSpot) {
      radius = Math.max(radius, minimumRadius);

      let lowestOverlapScore = Number.POSITIVE_INFINITY;
      for (let attempt = 0; attempt < 160; attempt += 1) {
        const candidateX =
          edgePadding + radius + random() * Math.max(1, width - edgePadding * 2 - radius * 2);
        const candidateY =
          titleSafeTop + radius + random() * Math.max(1, height - titleSafeTop - edgePadding - radius * 2);

        if (!withinBounds(candidateX, candidateY, radius)) {
          continue;
        }

        let overlapScore = 0;
        for (const point of placed) {
          const distance = Math.hypot(candidateX - point.x, candidateY - point.y);
          const minDistance = radius + point.r + initialBubbleGap;
          if (distance < minDistance) {
            overlapScore += minDistance - distance;
          }
        }

        if (overlapScore < lowestOverlapScore) {
          lowestOverlapScore = overlapScore;
          x = candidateX;
          y = candidateY;
        }

        if (overlapScore === 0) {
          break;
        }
      }
    }

    placed.push({ x, y, r: radius });

    return {
      categoryKey,
      value: numericValue,
      percent: (numericValue / totalAmount) * 100,
      x,
      y,
      r: radius,
      diameter: radius * 2,
      animationDuration: (6 + random() * 6).toFixed(2),
      animationDelay: (-random() * 6).toFixed(2),
    };
  });

  separateBubbles(bubbles, simulationBubbleGap, 120);

  const minimumTextRadius = textSafeBubbleDiameter / 2;
  let safetyPass = 0;
  while (hasOverlap(bubbles, simulationBubbleGap) && safetyPass < 8) {
    const shrinkFactor = width <= 520 ? 0.94 : 0.96;
    for (const bubble of bubbles) {
      bubble.r = Math.max(minimumTextRadius, bubble.r * shrinkFactor);
      bubble.diameter = bubble.r * 2;
      bubble.x = clamp(bubble.x, edgePadding + bubble.r, width - edgePadding - bubble.r);
      bubble.y = clamp(bubble.y, titleSafeTop + bubble.r, height - edgePadding - bubble.r);
    }

    separateBubbles(bubbles, simulationBubbleGap, 60);
    safetyPass += 1;
  }

  return bubbles.map(({ r, ...bubble }) => bubble);
}

export default function useAnalyticsPage({
  trendData,
  analyticsExpenses,
  categoryTotals,
  analyticsGroupBy,
  analyticsTotal,
  setDateFilterMode,
  applyCustomDateRange,
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

  const bubblePanelHeight = useMemo(
    () => calculateCategoryPanelsHeight(bubbleBoardSize.width, visibleCategories.length),
    [bubbleBoardSize.width, visibleCategories.length],
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

  const summaryTotalSpending = useMemo(
    () => (excludeOutliers ? formatCurrency(displayedAnalyticsTotal) : formatCurrency(analyticsTotal)),
    [excludeOutliers, displayedAnalyticsTotal, analyticsTotal],
  );

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

  return {
    lineCanvasRef,
    bubbleBoardRef,
    isDarkMode,
    excludeOutliers,
    setExcludeOutliers,
    useLogScale,
    setUseLogScale,
    visibleTrendPoints,
    outlierWarningText,
    displayedAnalyticsExpenses,
    summaryTotalSpending,
    chartCategories,
    totalCategoryAmount,
    visibleCategories,
    bubblePanelHeight,
    bubbleLayout,
    hiddenBubbleCategories,
    toggleBubbleCategory,
    handleQuickDateMode,
    handleApplyDateRange,
  };
}
