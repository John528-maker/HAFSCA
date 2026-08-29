import {
  matMul,
  matVec,
  solveGE,
  transpose,
  vectorNorm,
} from "./linalg.ts";
import { meanSquaredError } from "./metrics.ts";
import {
  cubicTruth,
  generateCubicDataset,
  MAX_U_CURVE_DEGREE,
  splitCubic,
} from "./overfit.ts";
import { buildDesignMatrix, predict, type FittedModel } from "./regression.ts";

/** Same dimensionless RIDGE the engine uses. The student slider is this multiplier ρ. */
export const RIDGE_RHO_ENGINE = 1e-8;
export const RIDGE_LOG_RHO_MIN = -8;
export const RIDGE_LOG_RHO_MAX = 3;
export const RIDGE_PATH_POINTS = 41;

export const RIDGE_DEFAULTS = {
  degree: 10,
  datasetSize: 50,
  trainRatio: 0.8,
  noiseLevel: 0.25,
  randomSeed: 42,
  log10Rho: 0,
} as const;

export interface RidgeConfig {
  degree: number;
  datasetSize: number;
  trainRatio: number;
  noiseLevel: number;
  randomSeed: number;
}

export function validateRidgeConfig(config: RidgeConfig): RidgeConfig {
  const degree = Math.floor(config.degree);
  if (degree < 3 || degree > MAX_U_CURVE_DEGREE) {
    throw new Error(
      `ridge degree ${degree} is outside [3, ${MAX_U_CURVE_DEGREE}]`,
    );
  }
  return { ...config, degree };
}

export function meanDiagonal(A: number[][]): number {
  let trace = 0;
  for (let i = 0; i < A.length; i++) trace += A[i]![i]!;
  return trace / A.length;
}

/**
 * Primal ridge: θ = (XᵀX + λI)⁻¹ Xᵀy with λ = ρ · mean(diag(XᵀX)).
 * Relative units, matching the engine. p must be ≤ n (no dual path).
 */
export function primalRelativeRidge(
  X: number[][],
  y: number[],
  rho: number,
): { theta: number[]; lambda: number; meanDiag: number } {
  if (rho <= 0 || !Number.isFinite(rho)) {
    throw new Error("primalRelativeRidge: ρ must be positive and finite");
  }
  const n = X.length;
  const p = X[0]!.length;
  if (p > n) {
    throw new Error("primalRelativeRidge: requires p ≤ n");
  }
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const meanDiag = meanDiagonal(XtX);
  const lambda = rho * meanDiag;
  const G = XtX.map((row, i) =>
    row.map((value, j) => (i === j ? value + lambda : value)),
  );
  const Xty = matVec(Xt, y);
  const theta = solveGE(G, Xty);
  if (theta === null) {
    throw new Error("primalRelativeRidge: Gram solve failed");
  }
  return { theta, lambda, meanDiag };
}

export function fitPolynomialRelativeRidge(
  xs: number[],
  ys: number[],
  degree: number,
  rho: number,
): FittedModel & { lambda: number; meanDiag: number } {
  if (degree > MAX_U_CURVE_DEGREE) {
    throw new Error(`ridge degree ${degree} exceeds cap ${MAX_U_CURVE_DEGREE}`);
  }
  const X = buildDesignMatrix(xs, degree);
  const { theta, lambda, meanDiag } = primalRelativeRidge(X, ys, rho);
  return {
    degree,
    coefficients: theta,
    paramCount: degree + 1,
    lambda,
    meanDiag,
  };
}

export interface RidgePathPoint {
  log10Rho: number;
  rho: number;
  lambda: number;
  trainMSE: number;
  testMSE: number;
  noisyTestMSE: number;
  coefNorm: number;
  coefficients: number[];
}

export interface RidgeRun {
  path: RidgePathPoint[];
  bestLog10Rho: number;
  hasInteriorDip: boolean;
}

export function logSpacedRho(count = RIDGE_PATH_POINTS): number[] {
  const out: number[] = [];
  const span = RIDGE_LOG_RHO_MAX - RIDGE_LOG_RHO_MIN;
  for (let i = 0; i < count; i++) {
    const log10Rho = RIDGE_LOG_RHO_MIN + (span * i) / (count - 1);
    out.push(10 ** log10Rho);
  }
  return out;
}

export function runRidgePath(config: RidgeConfig): RidgeRun {
  const safe = validateRidgeConfig(config);
  const dataset = splitCubic(
    generateCubicDataset(safe.datasetSize, safe.noiseLevel, safe.randomSeed),
    safe.trainRatio,
    safe.randomSeed,
  );
  const trainX = dataset.train.map((point) => point.x);
  const trainY = dataset.train.map((point) => point.y);
  const testX = dataset.test.map((point) => point.x);
  const testY = dataset.test.map((point) => point.y);
  const trueTestY = testX.map(cubicTruth);
  const rhos = logSpacedRho();
  const path: RidgePathPoint[] = rhos.map((rho) => {
    const model = fitPolynomialRelativeRidge(trainX, trainY, safe.degree, rho);
    const trainPred = predict(model, trainX);
    const testPred = predict(model, testX);
    return {
      log10Rho: Math.log10(rho),
      rho,
      lambda: model.lambda,
      trainMSE: meanSquaredError(trainPred, trainY),
      testMSE: meanSquaredError(testPred, trueTestY),
      noisyTestMSE: meanSquaredError(testPred, testY),
      coefNorm: vectorNorm(model.coefficients),
      coefficients: model.coefficients,
    };
  });
  const best = path.reduce((a, b) => (b.testMSE < a.testMSE ? b : a));
  const left = path[0]!;
  const right = path.at(-1)!;
  const hasInteriorDip =
    best.log10Rho > left.log10Rho + 1e-9 &&
    best.log10Rho < right.log10Rho - 1e-9 &&
    best.testMSE < left.testMSE * 0.98;
  return { path, bestLog10Rho: best.log10Rho, hasInteriorDip };
}
