import { minNormLeastSquares } from "./linalg.ts";
import { meanSquaredError } from "./metrics.ts";
import { createRng, gaussian } from "./random.ts";

export const OLS_N_DEFAULT = 8;
export const OLS_N_MIN = 2;
export const OLS_N_MAX = 24;
export const OLS_SXX_EPS = 1e-12;
export const OLS_SST_EPS = 1e-12;
export const OLS_TRUTH_W = 0.8;
export const OLS_TRUTH_B = 0.15;
export const OLS_X_MIN = -1;
export const OLS_X_MAX = 1;
export const OLS_Y_MIN = -2;
export const OLS_Y_MAX = 2;
export const OLS_OUTLIER = { x: 0.92, y: 1.85 } as const;
export const OLS_DEFAULTS = {
  n: OLS_N_DEFAULT,
  noise: 0.15,
  seed: 42,
  interceptOn: true,
} as const;

export interface OlsPoint {
  id: number;
  x: number;
  y: number;
}

export function clampOlsX(x: number): number {
  return Math.min(OLS_X_MAX, Math.max(OLS_X_MIN, x));
}

export function clampOlsY(y: number): number {
  return Math.min(OLS_Y_MAX, Math.max(OLS_Y_MIN, y));
}

export function olsTruth(x: number): number {
  return OLS_TRUTH_W * x + OLS_TRUTH_B;
}

export function generateOlsPoints(
  n: number,
  noise: number,
  seed: number,
): OlsPoint[] {
  const count = Math.min(OLS_N_MAX, Math.max(OLS_N_MIN, Math.floor(n)));
  const rng = createRng(seed);
  const points: OlsPoint[] = [];
  for (let i = 0; i < count; i++) {
    const x = -1 + (2 * (i + 0.5)) / count;
    const y = clampOlsY(olsTruth(x) + noise * gaussian(rng));
    points.push({ id: i, x, y });
  }
  return points;
}

export function nextOlsId(points: OlsPoint[]): number {
  return points.reduce((max, point) => Math.max(max, point.id), -1) + 1;
}

function means(points: OlsPoint[]): { xBar: number; yBar: number } {
  const n = points.length;
  let xBar = 0;
  let yBar = 0;
  for (const point of points) {
    xBar += point.x;
    yBar += point.y;
  }
  return { xBar: xBar / n, yBar: yBar / n };
}

/** S_xx for the intercept-on model. Rank check uses this, not the solver. */
export function sxx(points: OlsPoint[]): number {
  const { xBar } = means(points);
  let sum = 0;
  for (const point of points) {
    const dx = point.x - xBar;
    sum += dx * dx;
  }
  return sum;
}

export function sxy(points: OlsPoint[]): number {
  const { xBar, yBar } = means(points);
  let sum = 0;
  for (const point of points) {
    sum += (point.x - xBar) * (point.y - yBar);
  }
  return sum;
}

export function sumX2(points: OlsPoint[]): number {
  let sum = 0;
  for (const point of points) sum += point.x * point.x;
  return sum;
}

export function sst(points: OlsPoint[]): number {
  const { yBar } = means(points);
  let sum = 0;
  for (const point of points) {
    const dy = point.y - yBar;
    sum += dy * dy;
  }
  return sum;
}

export type OlsRankStatus = "ok" | "need-spread" | "need-points";

export function olsRankStatus(
  points: OlsPoint[],
  interceptOn: boolean,
): OlsRankStatus {
  if (points.length < OLS_N_MIN) return "need-points";
  const spread = interceptOn ? sxx(points) : sumX2(points);
  return spread > OLS_SXX_EPS ? "ok" : "need-spread";
}

export interface ClosedFormOls {
  w: number;
  b: number;
}

/** Golden-value check only. Production fitting goes through the engine solver. */
export function closedFormOls(
  points: OlsPoint[],
  interceptOn: boolean,
): ClosedFormOls | null {
  if (olsRankStatus(points, interceptOn) !== "ok") return null;
  if (interceptOn) {
    const w = sxy(points) / sxx(points);
    const { xBar, yBar } = means(points);
    return { w, b: yBar - w * xBar };
  }
  let xy = 0;
  for (const point of points) xy += point.x * point.y;
  return { w: xy / sumX2(points), b: 0 };
}

export interface LiveOlsFit {
  status: OlsRankStatus;
  w: number | null;
  b: number | null;
  kappa: number | null;
}

function gramKappa(a: number, c: number, d: number): number {
  const disc = Math.sqrt((a - d) ** 2 + 4 * c * c);
  const hi = (a + d + disc) / 2;
  const lo = (a + d - disc) / 2;
  const lambdaMax = Math.max(hi, lo);
  const lambdaMin = Math.min(hi, lo);
  if (!(lambdaMin > 0)) return Number.POSITIVE_INFINITY;
  return lambdaMax / lambdaMin;
}

/**
 * Rank-check first, then the shared solver. Never ask the ridge for a slope
 * when S_xx (or Σx²) is degenerate.
 */
export function fitLiveOls(
  points: OlsPoint[],
  interceptOn: boolean,
): LiveOlsFit {
  const status = olsRankStatus(points, interceptOn);
  if (status !== "ok") {
    return { status, w: null, b: null, kappa: null };
  }
  const y = points.map((point) => point.y);
  if (interceptOn) {
    const X = points.map((point) => [1, point.x]);
    const theta = minNormLeastSquares(X, y);
    let sumX = 0;
    let sumX2Val = 0;
    for (const point of points) {
      sumX += point.x;
      sumX2Val += point.x * point.x;
    }
    return {
      status,
      b: theta[0]!,
      w: theta[1]!,
      kappa: gramKappa(points.length, sumX, sumX2Val),
    };
  }
  const X = points.map((point) => [point.x]);
  const theta = minNormLeastSquares(X, y);
  return {
    status,
    w: theta[0]!,
    b: 0,
    kappa: 1,
  };
}

export interface OlsMetrics {
  sse: number;
  mse: number;
  rmse: number;
  mae: number;
  r2: number | null;
  residuals: number[];
  contributions: number[];
  maxAbsIndex: number;
  leverageShare: number;
}

/** Residual r = ŷ − y (prediction minus target). */
export function olsMetrics(
  points: OlsPoint[],
  w: number,
  b: number,
): OlsMetrics {
  const predictions = points.map((point) => w * point.x + b);
  const targets = points.map((point) => point.y);
  const mse = meanSquaredError(predictions, targets);
  const n = points.length;
  const residuals = predictions.map((pred, i) => pred - targets[i]!);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const contributions = residuals.map((r) => (r * r) / n);
  let mae = 0;
  let maxAbs = -1;
  let maxAbsIndex = 0;
  for (let i = 0; i < residuals.length; i++) {
    const abs = Math.abs(residuals[i]!);
    mae += abs;
    if (abs > maxAbs) {
      maxAbs = abs;
      maxAbsIndex = i;
    }
  }
  mae /= n;
  const total = sst(points);
  const r2 = total > OLS_SST_EPS ? 1 - sse / total : null;
  const maxSq = residuals[maxAbsIndex]! ** 2;
  const leverageShare = sse > 0 ? maxSq / sse : 0;
  return {
    sse,
    mse,
    rmse: Math.sqrt(mse),
    mae,
    r2,
    residuals,
    contributions,
    maxAbsIndex,
    leverageShare,
  };
}

export function canAddOutlier(points: OlsPoint[]): boolean {
  if (points.length >= OLS_N_MAX) return false;
  return !points.some(
    (point) =>
      Math.abs(point.x - OLS_OUTLIER.x) < 1e-9 &&
      Math.abs(point.y - OLS_OUTLIER.y) < 1e-9,
  );
}
