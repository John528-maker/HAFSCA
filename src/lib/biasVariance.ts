import { sampleInput } from "./dataset.ts";
import { cubicTruth, MAX_U_CURVE_DEGREE } from "./overfit.ts";
import { createRng, gaussian } from "./random.ts";
import { fitPolynomial, predict } from "./regression.ts";

export const BV_DEGREES = [0, 1, 2, 3, 5, 8, 12] as const;
export type BvDegree = (typeof BV_DEGREES)[number];

export const BV_M_CHOICES = [8, 20, 40] as const;
export const BV_N_CHOICES = [20, 30, 50] as const;

export interface BvConfig {
  M: number;
  n: number;
  sigma: number;
  seed: number;
}

export const BV_DEFAULTS: BvConfig = {
  M: 20,
  n: 30,
  sigma: 0.25,
  seed: 42,
};

export function validateBvConfig(config: BvConfig): BvConfig {
  if (!BV_M_CHOICES.includes(config.M as (typeof BV_M_CHOICES)[number])) {
    throw new Error(`bias-variance M must be 8, 20, or 40 (got ${config.M})`);
  }
  if (!BV_N_CHOICES.includes(config.n as (typeof BV_N_CHOICES)[number])) {
    throw new Error(`bias-variance n must be 20, 30, or 50 (got ${config.n})`);
  }
  if (config.sigma < 0) {
    throw new Error("bias-variance σ must be ≥ 0");
  }
  return { ...config };
}

export function evenGrid(min: number, max: number, count: number): number[] {
  const out: number[] = [];
  const span = max - min;
  for (let i = 0; i < count; i++) {
    out.push(min + (span * i) / (count - 1));
  }
  return out;
}

export interface BvDegreeSlice {
  degree: number;
  /** Mean curve ḡ(x) on the grid. */
  mean: number[];
  /** Plug-in (ḡ − f)². Biased upward by Var/M. */
  pluginBias2: number[];
  /** (ḡ − f)² − Var/M, clipped at 0. */
  debiasedBias2: number[];
  /** Sample variance with divisor M−1. */
  variance: number[];
  /** Direct 1/M ∑(ĝ_m − f)², unbiased for bias² + variance. */
  directError: number[];
  spaghetti: number[][];
  meanPluginBias2: number;
  meanDebiasedBias2: number;
  meanVariance: number;
  meanDirectError: number;
}

export interface BvRun {
  grid: number[];
  truth: number[];
  sigma2: number;
  slices: BvDegreeSlice[];
}

function meanOf(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Unbiased sample variance. Divisor is M−1, not M. */
export function sampleVarianceM1(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = meanOf(values);
  let ss = 0;
  for (const value of values) ss += (value - mean) ** 2;
  return ss / (values.length - 1);
}

export function runBiasVariance(config: BvConfig, gridCount = 101): BvRun {
  const { M, n, sigma, seed } = validateBvConfig(config);
  const grid = evenGrid(-1, 1, gridCount);
  const truth = grid.map(cubicTruth);
  const datasets: Array<{ x: number[]; y: number[] }> = [];
  for (let m = 0; m < M; m++) {
    const rng = createRng(seed + m * 1_000_003);
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < n; i++) {
      const xi = sampleInput(rng);
      x.push(xi);
      y.push(cubicTruth(xi) + sigma * gaussian(rng));
    }
    datasets.push({ x, y });
  }

  const slices: BvDegreeSlice[] = BV_DEGREES.map((degree) => {
    if (degree > MAX_U_CURVE_DEGREE) {
      throw new Error(`bias-variance degree ${degree} exceeds cap ${MAX_U_CURVE_DEGREE}`);
    }
    const spaghetti: number[][] = datasets.map((data) => {
      const model = fitPolynomial(data.x, data.y, degree);
      return predict(model, grid);
    });
    const mean: number[] = [];
    const pluginBias2: number[] = [];
    const debiasedBias2: number[] = [];
    const variance: number[] = [];
    const directError: number[] = [];
    for (let g = 0; g < grid.length; g++) {
      let sum = 0;
      for (let m = 0; m < M; m++) sum += spaghetti[m]![g]!;
      const gBar = sum / M;
      mean.push(gBar);
      let direct = 0;
      for (let m = 0; m < M; m++) {
        direct += (spaghetti[m]![g]! - truth[g]!) ** 2;
      }
      const v = sampleVarianceM1(spaghetti.map((row) => row[g]!));
      variance.push(v);
      const plugin = (gBar - truth[g]!) ** 2;
      pluginBias2.push(plugin);
      debiasedBias2.push(Math.max(0, plugin - v / M));
      directError.push(direct / M);
    }
    return {
      degree,
      mean,
      pluginBias2,
      debiasedBias2,
      variance,
      directError,
      spaghetti,
      meanPluginBias2: meanOf(pluginBias2),
      meanDebiasedBias2: meanOf(debiasedBias2),
      meanVariance: meanOf(variance),
      meanDirectError: meanOf(directError),
    };
  });

  return { grid, truth, sigma2: sigma * sigma, slices };
}

export function sliceAtDegree(run: BvRun, degree: number): BvDegreeSlice {
  const slice = run.slices.find((item) => item.degree === degree);
  if (!slice) throw new Error(`no bias-variance slice at degree ${degree}`);
  return slice;
}
