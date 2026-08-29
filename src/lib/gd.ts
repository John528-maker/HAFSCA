import { sampleInput } from "./dataset.ts";
import { minNormLeastSquares } from "./linalg.ts";
import { meanSquaredError } from "./metrics.ts";
import { createRng, gaussian } from "./random.ts";

export const GD_N = 20;
export const GD_LOSS_HALT = 1e6;
export const GD_DEFAULTS = {
  alpha: 0.2,
  w0: -1.2,
  b0: 1.4,
  iterations: 80,
  scale: 1,
  noise: 0.1,
  seed: 42,
} as const;

export interface GdPoint {
  t: number;
  w: number;
  b: number;
  loss: number;
  gradNorm: number;
}

export interface GdDataset {
  x: number[];
  y: number[];
  xUnscaled: number[];
}

export interface Hessian2 {
  a: number;
  c: number;
  d: number;
}

export function generateGdDataset(
  seed: number,
  noise: number,
  scale: number,
  n = GD_N,
): GdDataset {
  const rng = createRng(seed);
  const xUnscaled: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const value = sampleInput(rng);
    xUnscaled.push(value);
    y.push(0.8 * value + 0.15 + noise * gaussian(rng));
  }
  const x = xUnscaled.map((value) => scale * value);
  return { x, y, xUnscaled };
}

/** Residual r = ŵx + b − y (prediction minus target). */
export function linearLoss(
  w: number,
  b: number,
  x: number[],
  y: number[],
): number {
  return meanSquaredError(
    x.map((value) => w * value + b),
    y,
  );
}

export function linearGradient(
  w: number,
  b: number,
  x: number[],
  y: number[],
): { dw: number; db: number } {
  const n = x.length;
  let dw = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const r = w * x[i]! + b - y[i]!;
    dw += x[i]! * r;
    db += r;
  }
  return { dw: (2 / n) * dw, db: (2 / n) * db };
}

/** H = (2/n) XᵀX for columns [x, 1], so H₂₂ = 2. */
export function linearHessian(x: number[]): Hessian2 {
  const n = x.length;
  let sumX = 0;
  let sumX2 = 0;
  for (const value of x) {
    sumX += value;
    sumX2 += value * value;
  }
  return {
    a: (2 / n) * sumX2,
    c: (2 / n) * sumX,
    d: 2,
  };
}

export function hessianEigs(h: Hessian2): {
  lambdaMax: number;
  lambdaMin: number;
} {
  const disc = Math.sqrt((h.a - h.d) ** 2 + 4 * h.c * h.c);
  const hi = (h.a + h.d + disc) / 2;
  const lo = (h.a + h.d - disc) / 2;
  return {
    lambdaMax: Math.max(hi, lo),
    lambdaMin: Math.min(hi, lo),
  };
}

export function olsLinear(x: number[], y: number[]): { w: number; b: number } {
  const X = x.map((value) => [value, 1]);
  const theta = minNormLeastSquares(X, y);
  return { w: theta[0]!, b: theta[1]! };
}

export type GdStatus = "monotonic" | "oscillating" | "diverging";

export function gdStatus(alpha: number, lambdaMax: number): GdStatus {
  if (!(lambdaMax > 0) || !(alpha > 0)) return "diverging";
  const crit = 2 / lambdaMax;
  const osc = 1 / lambdaMax;
  if (alpha >= crit) return "diverging";
  if (alpha > osc) return "oscillating";
  return "monotonic";
}

export function runGradientDescent(
  x: number[],
  y: number[],
  w0: number,
  b0: number,
  alpha: number,
  iterations: number,
): { path: GdPoint[]; diverged: boolean } {
  const path: GdPoint[] = [];
  let w = w0;
  let b = b0;
  let diverged = false;

  for (let t = 0; t <= iterations; t++) {
    const loss = linearLoss(w, b, x, y);
    const grad = linearGradient(w, b, x, y);
    const gradNorm = Math.hypot(grad.dw, grad.db);
    const finite =
      Number.isFinite(w) &&
      Number.isFinite(b) &&
      Number.isFinite(loss) &&
      Number.isFinite(gradNorm);
    if (!finite || loss > GD_LOSS_HALT) {
      diverged = true;
      break;
    }
    path.push({ t, w, b, loss, gradNorm });
    if (t === iterations) break;
    w -= alpha * grad.dw;
    b -= alpha * grad.db;
  }

  return { path, diverged };
}
