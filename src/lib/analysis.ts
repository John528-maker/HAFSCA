import type { DoubleDescentVerdict, ModelResult } from "../types/experiment.ts";
import { getMessages, type Locale } from "./i18n.ts";

/** Tunable double-descent detection thresholds. */
export const DD_THRESHOLDS = {
  SMOOTH_WINDOW: 3,
  CLEAR_RISE: 1.5,
  CLEAR_DROP: 0.7,
  RISE: 1.2,
  DROP: 0.85,
  /**
   * A second minimum within 2× the first is in the same practical error
   * regime; a fall that remains worse by more than 100% is not competitive.
   */
  COMPETITIVE_SECOND_MIN: 2,
  /**
   * A 100× rise is two orders of magnitude and treated as a numerical
   * blow-up when the curve does not recover to the competitive regime.
   */
  DIVERGENCE_RISE: 100,
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
 * Separates a numerical blow-up from an observed or absent double descent.
 */
export function analyzeDoubleDescent(results: ModelResult[]): DoubleDescentVerdict {
  if (results.length < 8) return "No Clear Double Descent";

  const raw = results.map((r) => r.testMSE);
  if (raw.some((value) => !Number.isFinite(value))) {
    return "Numerical Divergence";
  }
  const smoothed = smooth(raw, DD_THRESHOLDS.SMOOTH_WINDOW);

  // 1. First local minimum (classical sweet spot).
  let firstMin: CurvePoint | null = null;
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i]! <= smoothed[i - 1]! && smoothed[i]! <= smoothed[i + 1]!) {
      firstMin = { index: i, degree: results[i]!.degree, value: smoothed[i]! };
      break;
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
  if (!peak || peak.value <= firstMin.value) return "No Clear Double Descent";
  const rise = peak.value / Math.max(firstMin.value, 1e-12);

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
    return rise >= DD_THRESHOLDS.DIVERGENCE_RISE
      ? "Numerical Divergence"
      : "No Clear Double Descent";
  }

  const dropRatio = secondMin.value / peak.value;
  const secondMinRatio =
    secondMin.value / Math.max(firstMin.value, 1e-12);
  const isCompetitive =
    secondMinRatio <= DD_THRESHOLDS.COMPETITIVE_SECOND_MIN;

  if (rise >= DD_THRESHOLDS.DIVERGENCE_RISE && !isCompetitive) {
    return "Numerical Divergence";
  }

  if (
    rise >= DD_THRESHOLDS.CLEAR_RISE &&
    dropRatio <= DD_THRESHOLDS.CLEAR_DROP &&
    secondMin.value < firstMin.value
  ) {
    return "Clear Double Descent";
  }

  if (
    rise >= DD_THRESHOLDS.RISE &&
    dropRatio <= DD_THRESHOLDS.DROP &&
    isCompetitive
  ) {
    return "Possible Double Descent";
  }

  return "No Clear Double Descent";
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

  if (verdict === "Clear Double Descent") {
    notes.push(a.clearDoubleDescent);
  } else if (verdict === "Possible Double Descent") {
    notes.push(a.possibleDoubleDescent);
  } else if (verdict === "Numerical Divergence") {
    notes.push(a.numericalDivergence);
  } else {
    notes.push(a.noDoubleDescent);
  }

  return notes;
}

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
