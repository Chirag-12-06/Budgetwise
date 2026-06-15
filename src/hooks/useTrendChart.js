import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { formatCurrency } from "../lib/api";

  export default function useTrendChart({
  visibleTrendPoints,
  analyticsGroupBy,
  isDarkMode,
  useLogScale,
  onTrendPointSelect,
}) {

  const lineCanvasRef = useRef(null);
  const lineChartRef = useRef(null);

  
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
        onClick: (event, _elements, chart) => {
          if (typeof onTrendPointSelect !== "function") {
            return;
          }

          const nearestElements = chart.getElementsAtEventForMode(
            event,
            "nearest",
            { intersect: true },
            false,
          );
          const pointIndex = nearestElements[0]?.index;
          if (typeof pointIndex !== "number") {
            return;
          }

          const selectedPoint = visibleTrendPoints[pointIndex];
          if (!selectedPoint) {
            return;
          }

          onTrendPointSelect(selectedPoint);
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
  }, [visibleTrendPoints, analyticsGroupBy, isDarkMode, useLogScale, onTrendPointSelect]);

  return {
    lineCanvasRef,
  };
}