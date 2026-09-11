import { sampleInput } from "./dataset.ts";
import { meanSquaredError } from "./metrics.ts";
import { createRng, gaussian, shuffleInPlace } from "./random.ts";
import { fitPolynomial, predict } from "./regression.ts";
import { cubicTruth, MAX_U_CURVE_DEGREE } from "./overfit.ts";
import type { DataPoint } from "../types/experiment.ts";

export const GEN_DEFAULTS = {
  datasetSize: 60,
  noiseLevel: 0.25,
  trainRatio: 0.6,
  validRatio: 0.2,
  randomSeed: 42,
  maxDegree: MAX_U_CURVE_DEGREE,
} as const;

export interface GenSplit {
  train: DataPoint[];
  valid: DataPoint[];
  test: DataPoint[];
  all: DataPoint[];
}

export interface GenDegreeRow {
  degree: number;
  paramCount: number;
  trainMSE: number;
  validMSE: number;
  testMSE: number;
  coefficients: number[];
}

export interface GenRun {
  split: GenSplit;
  rows: GenDegreeRow[];
  /** Degree that minimizes validation MSE (honest selection). */
  degreeByValid: number;
  /** Degree that minimizes test MSE (peeking — optimistic). */
  degreeByTest: number;
  validMseAtValidPick: number;
  testMseAtValidPick: number;
  testMseAtTestPick: number;
}

function generateCubicPoints(
  size: number,
  noiseLevel: number,
  seed: number,
): DataPoint[] {
  const rng = createRng(seed);
  const points: DataPoint[] = [];
  for (let i = 0; i < size; i++) {
    const x = sampleInput(rng);
    points.push({ x, y: cubicTruth(x) + noiseLevel * gaussian(rng) });
  }
  return points;
}

export function threeWaySplit(
  points: DataPoint[],
  trainRatio: number,
  validRatio: number,
  seed: number,
): GenSplit {
  const rng = createRng(seed + 10_000);
  const shuffled = points.map((point) => ({ ...point }));
  shuffleInPlace(shuffled, rng);
  const n = shuffled.length;
  const trainCount = Math.max(1, Math.floor(n * trainRatio));
  const validCount = Math.max(1, Math.floor(n * validRatio));
  const testCount = n - trainCount - validCount;
  if (testCount < 1) {
    throw new Error("threeWaySplit: need room for a held-out test set");
  }
  const train = shuffled.slice(0, trainCount);
  const valid = shuffled.slice(trainCount, trainCount + validCount);
  const test = shuffled.slice(trainCount + validCount);
  return { train, valid, test, all: points };
}

export function runGeneralizationExperiment(options?: {
  datasetSize?: number;
  noiseLevel?: number;
  randomSeed?: number;
  maxDegree?: number;
}): GenRun {
  const datasetSize = options?.datasetSize ?? GEN_DEFAULTS.datasetSize;
  const noiseLevel = options?.noiseLevel ?? GEN_DEFAULTS.noiseLevel;
  const randomSeed = options?.randomSeed ?? GEN_DEFAULTS.randomSeed;
  const maxDegree = Math.min(
    options?.maxDegree ?? GEN_DEFAULTS.maxDegree,
    MAX_U_CURVE_DEGREE,
  );

  const split = threeWaySplit(
    generateCubicPoints(datasetSize, noiseLevel, randomSeed),
    GEN_DEFAULTS.trainRatio,
    GEN_DEFAULTS.validRatio,
    randomSeed,
  );

  const trainX = split.train.map((p) => p.x);
  const trainY = split.train.map((p) => p.y);
  const validX = split.valid.map((p) => p.x);
  const validY = split.valid.map((p) => p.y);
  const testX = split.test.map((p) => p.x);
  const trueTestY = testX.map(cubicTruth);

  const rows: GenDegreeRow[] = [];
  let degreeByValid = 0;
  let degreeByTest = 0;
  let bestValid = Number.POSITIVE_INFINITY;
  let bestTest = Number.POSITIVE_INFINITY;

  for (let degree = 0; degree <= maxDegree; degree++) {
    const model = fitPolynomial(trainX, trainY, degree);
    const trainMSE = meanSquaredError(predict(model, trainX), trainY);
    const validMSE = meanSquaredError(predict(model, validX), validY);
    const testMSE = meanSquaredError(predict(model, testX), trueTestY);
    rows.push({
      degree,
      paramCount: model.paramCount,
      trainMSE,
      validMSE,
      testMSE,
      coefficients: model.coefficients,
    });
    if (validMSE < bestValid) {
      bestValid = validMSE;
      degreeByValid = degree;
    }
    if (testMSE < bestTest) {
      bestTest = testMSE;
      degreeByTest = degree;
    }
  }

  const atValid = rows.find((r) => r.degree === degreeByValid)!;
  const atTest = rows.find((r) => r.degree === degreeByTest)!;

  return {
    split,
    rows,
    degreeByValid,
    degreeByTest,
    validMseAtValidPick: atValid.validMSE,
    testMseAtValidPick: atValid.testMSE,
    testMseAtTestPick: atTest.testMSE,
  };
}
