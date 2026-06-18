export function createSeededRandom(seedInput) {
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

export function detectOutliers(data) {
  const values = data
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return {
      outliers: [],
      upperBound: null,
      lowerBound: null,
      hasOutliers: false,
    };
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
  const outliers = values.filter(
    (value) => value < lowerBound || value > upperBound,
  );

  return {
    outliers,
    upperBound,
    lowerBound,
    hasOutliers: outliers.length > 0,
  };
}

export function isWithinOutlierBounds(value, outlierInfo) {
  if (!outlierInfo?.hasOutliers) return true;
  return value >= outlierInfo.lowerBound && value <= outlierInfo.upperBound;
}

export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getTextSafeBubbleDiameter(width) {
  if (width <= 360) {
    return 54;
  }

  if (width <= 520) {
    return 58;
  }

  return 62;
}

export function calculateCategoryPanelsHeight(width, categoryCount) {
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

export function buildBubbleLayout(
  categories,
  width,
  height,
  totalAmount,
  useLogScale,
) {
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
  const scaledMaxValue = Math.max(
    ...categories.map(([, value]) => scaleValue(value)),
    1,
  );
  const textSafeBubbleDiameter = getTextSafeBubbleDiameter(width);
  const targetPerBubble = area / Math.max(categories.length, 1);
  const widthDensityScale =
    width <= 360
      ? 0.58
      : width <= 420
        ? 0.68
        : width <= 520
          ? 0.78
          : width <= 700
            ? 0.88
            : 1;
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
    Math.min(
      178,
      Math.sqrt(targetPerBubble) * 1.45 * widthDensityScale * countDensityScale,
    ),
  );
  let minBubbleDiameter = useLogScale
    ? Math.max(12, Math.min(46, maxBubbleDiameter * 0.28))
    : Math.max(16, Math.min(56, maxBubbleDiameter * 0.34));
  minBubbleDiameter = Math.max(minBubbleDiameter, textSafeBubbleDiameter);

  const estimatedBubbleCoverage = categories.reduce((sum, [, value]) => {
    const numericValue = Number(value || 0);
    const scaledValue = scaleValue(numericValue);
    const relative =
      scaledMaxValue > 0 ? Math.sqrt(scaledValue / scaledMaxValue) : 0;
    const estimatedDiameter = Math.max(
      minBubbleDiameter,
      Math.min(
        maxBubbleDiameter,
        minBubbleDiameter + relative * (maxBubbleDiameter - minBubbleDiameter),
      ),
    );
    const estimatedRadius = estimatedDiameter / 2;
    return sum + Math.PI * estimatedRadius * estimatedRadius;
  }, 0);
  const maxCoverageRatio =
    width <= 420 ? 0.42 : width <= 520 ? 0.46 : width <= 700 ? 0.52 : 0.56;
  const maxBubbleCoverage = area * maxCoverageRatio;
  if (
    estimatedBubbleCoverage > maxBubbleCoverage &&
    estimatedBubbleCoverage > 0
  ) {
    const shrinkScale = Math.sqrt(maxBubbleCoverage / estimatedBubbleCoverage);
    maxBubbleDiameter = Math.max(
      textSafeBubbleDiameter,
      maxBubbleDiameter * shrinkScale,
    );
    minBubbleDiameter = Math.max(
      textSafeBubbleDiameter,
      minBubbleDiameter * shrinkScale,
    );
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
    x >= edgePadding + radius &&
    x <= width - edgePadding - radius &&
    y >= titleSafeTop + radius &&
    y <= height - edgePadding - radius;

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
        bubble.x = clamp(
          bubble.x,
          edgePadding + bubble.r,
          width - edgePadding - bubble.r,
        );
        bubble.y = clamp(
          bubble.y,
          titleSafeTop + bubble.r,
          height - edgePadding - bubble.r,
        );
      }

      if (!moved) {
        break;
      }
    }
  };

  const hasOverlap = (items, gap) =>
    items.some((bubbleA, i) =>
      items.slice(i + 1).some((bubbleB) => {
        const distance = Math.hypot(
          bubbleB.x - bubbleA.x,
          bubbleB.y - bubbleA.y,
        );
        return distance < bubbleA.r + bubbleB.r + gap;
      }),
    );

  const bubbles = categories.map(([categoryKey, value], index) => {
    const numericValue = Number(value || 0);
    const scaledValue = scaleValue(numericValue);
    const relative =
      scaledMaxValue > 0 ? Math.sqrt(scaledValue / scaledMaxValue) : 0;
    const baseDiameter = Math.max(
      minBubbleDiameter,
      Math.min(
        maxBubbleDiameter,
        minBubbleDiameter + relative * (maxBubbleDiameter - minBubbleDiameter),
      ),
    );

    let radius = baseDiameter / 2;
    const minimumRadius = textSafeBubbleDiameter / 2;
    const random = createSeededRandom(categoryKey);
    let x = centerX;
    let y = centerY;
    let foundSpot = false;

    while (!foundSpot && radius >= minimumRadius) {
      if (
        index === 0 &&
        withinBounds(centerX, centerY, radius) &&
        !overlapsPlaced(centerX, centerY, radius)
      ) {
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
            edgePadding +
            radius +
            random() * Math.max(1, width - edgePadding * 2 - radius * 2);
          const candidateY =
            titleSafeTop +
            radius +
            random() *
              Math.max(1, height - titleSafeTop - edgePadding - radius * 2);
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
          edgePadding +
          radius +
          random() * Math.max(1, width - edgePadding * 2 - radius * 2);
        const candidateY =
          titleSafeTop +
          radius +
          random() *
            Math.max(1, height - titleSafeTop - edgePadding - radius * 2);

        if (!withinBounds(candidateX, candidateY, radius)) {
          continue;
        }

        let overlapScore = 0;
        for (const point of placed) {
          const distance = Math.hypot(
            candidateX - point.x,
            candidateY - point.y,
          );
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
      bubble.x = clamp(
        bubble.x,
        edgePadding + bubble.r,
        width - edgePadding - bubble.r,
      );
      bubble.y = clamp(
        bubble.y,
        titleSafeTop + bubble.r,
        height - edgePadding - bubble.r,
      );
    }

    separateBubbles(bubbles, simulationBubbleGap, 60);
    safetyPass += 1;
  }

  return bubbles.map(({ r, ...bubble }) => bubble);
}
