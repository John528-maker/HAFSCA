import type { DoubleDescentVerdict, ModelResult } from "../types/experiment.ts";
import { getMessages, type Locale } from "./i18n.ts";

/** Calibrated double-descent detection thresholds. */
export const DD_THRESHOLDS = {
  /** Three points suppress isolated degree-grid jitter without erasing the peak. */
  SMOOTH_WINDOW: 3,
  /**
   * The wide-sweep measurements do not identify a statistical rise/drop
   * cutoff. A factor of two is therefore an explicit visual-salience rule,
   * not a fitted constant: the peak must double and then halve.
   */
  MIN_VISIBLE_RISE: 2,
  MAX_VISIBLE_DROP: 0.5,
  /**
   * Task-1 calibration reports ratio<2 directly. This is the outer boundary
   * of the same practical error regime; larger truth-target ratios were not
   * considered a competitive return.
   */
  COMPETITIVE_SECOND_MIN: 2,
  /**
   * Standard forward-error analysis bounds relative solve error by κ·ε.
   * At 1e-2, fewer than about two decimal digits remain trustworthy, which is
   * the numerical-failure boundary. Large MSE alone is never a failure signal.
   */
  MAX_FORWARD_ERROR_BOUND: 1e-2,
  /**
   * With 10 test points, 22/24 seeds received a DD verdict; at 160 points that
   * fell to 8/24. Below 160, a single run is too noisy for a True verdict.
   */
  MIN_RELIABLE_TEST_SIZE: 160,
} as const;

export function findInterpolationThreshold(
  results: ModelResult[],
  mseThreshold: number,
): number | null {
  for (const r of results) {
    if (r.trainMSE < mseThreshold) return r.degree;
  }
  return null;
}

function smooth(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < values.length) {
        sum += values[j]!;
        count++;
      }
    }
    return sum / count;
  });
}

interface CurvePoint {
  index: number;
  degree: number;
  value: number;
}

/**
 * Detect the classical U → peak → second descent pattern on the test-error curve.
 * Detection uses truth-target test MSE. This matches the 24-seed calibration,
 * removes the additive noise-variance pedestal, and measures recovery toward f.
 */
export function analyzeDoubleDescent(
  results: ModelResult[],
  testSize = Number.POSITIVE_INFINITY,
  interpolationDegree?: number,
): DoubleDescentVerdict {
  if (results.length < 8) return "No Second Descent Observed";

  const raw = results.map((r) => r.testMSE);
  const hasNonFinite = results.some(
    (result) =>
      !Number.isFinite(result.trainMSE) ||
      !Number.isFinite(result.testMSE) ||
      !Number.isFinite(result.noisyTestMSE) ||
      !Number.isFinite(result.conditionNumberUpperBound) ||
      result.coefficients.some((value) => !Number.isFinite(value)),
  );
  const hasInsufficientPrecision = results.some(
    (result) =>
      result.conditionNumberUpperBound * Number.EPSILON >=
      DD_THRESHOLDS.MAX_FORWARD_ERROR_BOUND,
  );
  if (hasNonFinite || hasInsufficientPrecision) {
    return "Numerical Failure";
  }
  const smoothed = smooth(raw, DD_THRESHOLDS.SMOOTH_WINDOW);

  // 1. Classical sweet spot: the best point before known interpolation.
  let firstMin: CurvePoint | null = null;
  if (interpolationDegree !== undefined) {
    for (let i = 0; i < smoothed.length; i++) {
      if (results[i]!.degree >= interpolationDegree) break;
      if (!firstMin || smoothed[i]! < firstMin.value) {
        firstMin = {
          index: i,
          degree: results[i]!.degree,
          value: smoothed[i]!,
        };
      }
    }
  } else {
    for (let i = 1; i < smoothed.length - 1; i++) {
      if (
        smoothed[i]! <= smoothed[i - 1]! &&
        smoothed[i]! <= smoothed[i + 1]!
      ) {
        firstMin = {
          index: i,
          degree: results[i]!.degree,
          value: smoothed[i]!,
        };
        break;
      }
    }
  }
  if (!firstMin) {
    // Fallback: lowest point in the first third of the curve.
    const end = Math.max(2, Math.floor(smoothed.length / 3));
    let best = 0;
    for (let i = 1; i < end; i++) {
      if (smoothed[i]! < smoothed[best]!) best = i;
    }
    firstMin = { index: best, degree: results[best]!.degree, value: smoothed[best]! };
  }

  // 2. Local maximum after firstMin (interpolation peak).
  let peak: CurvePoint | null = null;
  for (let i = firstMin.index + 1; i < smoothed.length - 1; i++) {
    if (smoothed[i]! >= smoothed[i - 1]! && smoothed[i]! >= smoothed[i + 1]!) {
      if (!peak || smoothed[i]! > peak.value) {
        peak = { index: i, degree: results[i]!.degree, value: smoothed[i]! };
      }
    }
  }
  // Also consider the global max after firstMin in case no strict local max exists.
  if (!peak) {
    let best = firstMin.index + 1;
    for (let i = firstMin.index + 1; i < smoothed.length; i++) {
      if (smoothed[i]! > smoothed[best]!) best = i;
    }
    if (best > firstMin.index) {
      peak = { index: best, degree: results[best]!.degree, value: smoothed[best]! };
    }
  }
  if (!peak || peak.value <= firstMin.value) return "No Second Descent Observed";
  const rise = peak.value / Math.max(firstMin.value, 1e-12);
  const hasVisibleRise = rise >= DD_THRESHOLDS.MIN_VISIBLE_RISE;
  if (!hasVisibleRise) return "No Second Descent Observed";

  // 3. Subsequent minimum after the peak.
  let secondMin: CurvePoint | null = null;
  for (let i = peak.index + 1; i < smoothed.length - 1; i++) {
    if (smoothed[i]! <= smoothed[i - 1]! && smoothed[i]! <= smoothed[i + 1]!) {
      if (!secondMin || smoothed[i]! < secondMin.value) {
        secondMin = { index: i, degree: results[i]!.degree, value: smoothed[i]! };
      }
    }
  }
  // Fallback: lowest point after the peak.
  if (!secondMin && peak.index + 1 < smoothed.length) {
    let best = peak.index + 1;
    for (let i = peak.index + 1; i < smoothed.length; i++) {
      if (smoothed[i]! < smoothed[best]!) best = i;
    }
    secondMin = { index: best, degree: results[best]!.degree, value: smoothed[best]! };
  }
  if (!secondMin || secondMin.value >= peak.value) {
    return "Variance Peak Without Recovery";
  }

  const dropRatio = secondMin.value / peak.value;
  const secondMinRatio =
    secondMin.value / Math.max(firstMin.value, 1e-12);
  const isCompetitive =
    secondMinRatio <= DD_THRESHOLDS.COMPETITIVE_SECOND_MIN;
  const hasVisibleShape =
    rise >= DD_THRESHOLDS.MIN_VISIBLE_RISE &&
    dropRatio <= DD_THRESHOLDS.MAX_VISIBLE_DROP;

  let lowestPostPeakIndex = peak.index + 1;
  for (let i = peak.index + 1; i < smoothed.length; i++) {
    if (smoothed[i]! < smoothed[lowestPostPeakIndex]!) lowestPostPeakIndex = i;
  }
  if (
    lowestPostPeakIndex === smoothed.length - 1 &&
    smoothed[lowestPostPeakIndex]! < smoothed[lowestPostPeakIndex - 1]!
  ) {
    return "Sweep Range Exhausted";
  }

  if (
    hasVisibleShape &&
    secondMin.value < firstMin.value &&
    testSize >= DD_THRESHOLDS.MIN_RELIABLE_TEST_SIZE
  ) {
    return "True Double Descent";
  }

  if (hasVisibleShape && isCompetitive) {
    return "Competitive Second Descent";
  }

  if (hasVisibleShape) return "Partial Recovery";

  return "Variance Peak Without Recovery";
}

/**
 * Emit only notes that are supported by the actual results.
 * Distinguishes "observed" from "may indicate".
 */
export function buildAnalysisNotes(
  results: ModelResult[],
  interpolationThreshold: number | null,
  verdict: DoubleDescentVerdict,
  locale: Locale = "en",
): string[] {
  const a = getMessages(locale).analysis;
  const notes: string[] = [];
  if (results.length === 0) return notes;

  const early = results.slice(0, Math.min(3, results.length));
  const earlyTrain = average(early.map((r) => r.trainMSE));
  const earlyTest = average(early.map((r) => r.testMSE));
  const midIdx = Math.floor(results.length / 3);
  const mid = results[midIdx]!;
  const bestTest = results.reduce((b, c) => (c.testMSE < b.testMSE ? c : b));

  if (earlyTrain > bestTest.testMSE * 1.5 && earlyTest > bestTest.testMSE * 1.5) {
    notes.push(a.underfitting);
  }

  if (mid.testMSE < earlyTest) {
    notes.push(a.testDecreases);
  }

  if (interpolationThreshold !== null) {
    const around = results.find((r) => r.degree === interpolationThreshold);
    const later = results.filter((r) => r.degree > interpolationThreshold);
    const peakAfter =
      later.length > 0
        ? later.reduce((b, c) => (c.testMSE > b.testMSE ? c : b))
        : null;

    notes.push(
      a.threshold(
        interpolationThreshold,
        around ? around.trainMSE.toExponential(2) : undefined,
      ),
    );

    if (peakAfter && around && peakAfter.testMSE > around.testMSE * 1.1) {
      notes.push(a.peakNearThreshold(peakAfter.degree));
    }
  }

  if (verdict === "True Double Descent") {
    notes.push(a.trueDoubleDescent);
  } else if (verdict === "Competitive Second Descent") {
    notes.push(a.competitiveSecondDescent);
  } else if (verdict === "Partial Recovery") {
    notes.push(a.partialRecovery);
  } else if (verdict === "Variance Peak Without Recovery") {
    notes.push(a.variancePeakWithoutRecovery);
  } else if (verdict === "Numerical Failure") {
    notes.push(a.numericalFailure);
  } else if (verdict === "Sweep Range Exhausted") {
    notes.push(a.sweepRangeExhausted);
  } else {
    notes.push(a.noSecondDescent);
  }

  return notes;
}

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
