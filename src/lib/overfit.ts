import { sampleInput } from "./dataset.ts";
import { meanSquaredError } from "./metrics.ts";
import { createRng, gaussian, shuffleInPlace } from "./random.ts";
import { fitPolynomial, predict } from "./regression.ts";
import type { DataPoint, DatasetSplit, ModelResult } from "../types/experiment.ts";
import { regularizedGramConditionUpperBound } from "./linalg.ts";

/** Hard cap for U-curve labs. Must be enforced in code, not only in copy. */
export const MAX_U_CURVE_DEGREE = 12;

/** 0.2 T₁(x) + 0.7 T₃(x) = 2.8 x³ − 1.9 x. Degree-3 Chebyshev coeffs [0, 0.2, 0, 0.7]. */
export function cubicTruth(x: number): number {
  return 0.2 * x + 0.7 * (4 * x ** 3 - 3 * x);
}

export interface OverfitConfig {
  datasetSize: number;
  noiseLevel: number;
  trainRatio: number;
  randomSeed: number;
  maxDegree: number;
}

export const OVERFIT_DEFAULTS: OverfitConfig = {
  datasetSize: 50,
  noiseLevel: 0.25,
  trainRatio: 0.8,
  randomSeed: 42,
  maxDegree: MAX_U_CURVE_DEGREE,
};

export function validateOverfitConfig(config: OverfitConfig): OverfitConfig {
  const maxDegree = Math.max(1, Math.floor(config.maxDegree));
  if (maxDegree > MAX_U_CURVE_DEGREE) {
    throw new Error(
      `overfit maxDegree ${maxDegree} exceeds cap ${MAX_U_CURVE_DEGREE}`,
    );
  }
  return { ...config, maxDegree };
}

export function generateCubicDataset(
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

export function splitCubic(
  points: DataPoint[],
  trainRatio: number,
  seed: number,
): DatasetSplit {
  const rng = createRng(seed + 10_000);
  const shuffled = points.map((point) => ({ ...point }));
  shuffleInPlace(shuffled, rng);
  const trainCount = Math.max(1, Math.floor(shuffled.length * trainRatio));
  const train = shuffled.slice(0, trainCount);
  const test = shuffled.slice(trainCount);
  if (test.length === 0) {
    throw new Error("overfit split: empty test set");
  }
  return { train, test, all: points };
}

export interface OverfitRun {
  dataset: DatasetSplit;
  results: ModelResult[];
  bestDegree: number;
  note: "u-curve" | "no-sweet-spot";
}

export function runOverfitExperiment(config: OverfitConfig): OverfitRun {
  const safe = validateOverfitConfig(config);
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

  const results: ModelResult[] = [];
  for (let degree = 0; degree <= safe.maxDegree; degree++) {
    const model = fitPolynomial(trainX, trainY, degree);
    const trainMSE = meanSquaredError(predict(model, trainX), trainY);
    const testMSE = meanSquaredError(predict(model, testX), trueTestY);
    const noisyTestMSE = meanSquaredError(predict(model, testX), testY);
    results.push({
      degree,
      paramCount: model.paramCount,
      trainMSE,
      testMSE,
      noisyTestMSE,
      conditionNumberUpperBound: regularizedGramConditionUpperBound(
        trainX.length,
        model.paramCount,
      ),
      generalizationGap: noisyTestMSE - trainMSE,
      coefficients: model.coefficients,
    });
  }

  const best = results.reduce((a, b) => (b.testMSE < a.testMSE ? b : a));
  const noisy3 = results.find((row) => row.degree === 3)?.noisyTestMSE;
  const noisy12 = results.find((row) => row.degree === 12)?.noisyTestMSE;
  const noisyBest = results.reduce((a, b) =>
    b.noisyTestMSE < a.noisyTestMSE ? b : a,
  );
  const note: OverfitRun["note"] =
    noisy3 !== undefined &&
    noisy12 !== undefined &&
    noisy12 > noisy3 * 1.3 &&
    noisyBest.degree <= 5
      ? "u-curve"
      : "no-sweet-spot";

  return { dataset, results, bestDegree: best.degree, note };
}
