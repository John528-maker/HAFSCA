/**
 * Diagnostic wide sweep (not part of npm scripts).
 * Run: node --experimental-strip-types scripts/dd-teststat.ts
 * Set DD_SEED_DETAILS=1 to print per-seed truth-target ratios at the default.
 */
import { performance } from "node:perf_hooks";
import { analyzeDoubleDescent } from "../src/lib/analysis.ts";
import { buildDataset, trueFunction } from "../src/lib/dataset.ts";
import { regularizedGramConditionUpperBound } from "../src/lib/linalg.ts";
import { meanSquaredError } from "../src/lib/metrics.ts";
import { fitPolynomial, predict } from "../src/lib/regression.ts";
import type { ModelResult } from "../src/types/experiment.ts";

const N_TRAIN = 40;
const TEST_SIZE = 460;
const SEEDS = Array.from({ length: 24 }, (_, index) => index + 1);

interface CurveStats {
  firstMSE: number;
  firstDegree: number;
  peakMSE: number;
  peakDegree: number;
  secondMSE: number;
  secondDegree: number;
  endpoint: boolean;
  ratio: number;
  verdict: string;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values: number[]): number {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function smooth(values: number[]): number[] {
  return values.map((_, index) => {
    const lo = Math.max(0, index - 1);
    const hi = Math.min(values.length - 1, index + 1);
    return mean(values.slice(lo, hi + 1));
  });
}

function curve(
  noise: number,
  seed: number,
  maxDegree: number,
): ModelResult[] {
  const dataset = buildDataset(
    N_TRAIN + TEST_SIZE,
    noise,
    N_TRAIN / (N_TRAIN + TEST_SIZE),
    seed,
  );
  const trainX = dataset.train.map((point) => point.x);
  const trainY = dataset.train.map((point) => point.y);
  const testX = dataset.test.map((point) => point.x);
  const trueTestY = testX.map(trueFunction);
  const noisyTestY = dataset.test.map((point) => point.y);
  const stride = Math.ceil(maxDegree / 120);
  const degreeSet = new Set<number>();
  for (let degree = 1; degree <= maxDegree; degree += stride) {
    degreeSet.add(degree);
  }
  for (let degree = 1; degree <= N_TRAIN + 14; degree++) degreeSet.add(degree);
  degreeSet.add(maxDegree);

  return [...degreeSet].sort((a, b) => a - b).map((degree) => {
    const model = fitPolynomial(trainX, trainY, degree);
    const trainMSE = meanSquaredError(predict(model, trainX), trainY);
    const testPred = predict(model, testX);
    const testMSE = meanSquaredError(testPred, trueTestY);
    const noisyTestMSE = meanSquaredError(testPred, noisyTestY);
    return {
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
    };
  });
}

function stats(results: ModelResult[]): CurveStats {
  const values = smooth(results.map((result) => result.testMSE));
  const thresholdIndex = results.findIndex(
    (result) => result.degree >= N_TRAIN - 1,
  );
  const points = results.map((result, index) => ({
    result,
    index,
    value: values[index]!,
  }));
  const first = points
    .filter(({ index }) => index < thresholdIndex)
    .reduce((best, point) => (point.value < best.value ? point : best));
  const peak = points
    .filter(({ index }) => index > first.index)
    .reduce((best, point) => (point.value > best.value ? point : best));
  const second = points
    .filter(({ index }) => index > peak.index)
    .reduce((best, point) => (point.value < best.value ? point : best));
  return {
    firstMSE: first.value,
    firstDegree: first.result.degree,
    peakMSE: peak.value,
    peakDegree: peak.result.degree,
    secondMSE: second.value,
    secondDegree: second.result.degree,
    endpoint: second.index === results.length - 1,
    ratio: second.value / first.value,
    verdict: analyzeDoubleDescent(results, TEST_SIZE, N_TRAIN - 1),
  };
}

function aggregate(rows: CurveStats[]) {
  return {
    firstDegree: mean(rows.map((row) => row.firstDegree)),
    firstMSE: mean(rows.map((row) => row.firstMSE)),
    peakDegree: mean(rows.map((row) => row.peakDegree)),
    peakMSE: mean(rows.map((row) => row.peakMSE)),
    secondDegree: mean(rows.map((row) => row.secondDegree)),
    secondMSE: mean(rows.map((row) => row.secondMSE)),
    interiorSecondMinCount: rows.filter((row) => !row.endpoint).length,
    endpointCount: rows.filter((row) => row.endpoint).length,
    ratio: mean(rows.map((row) => row.ratio)),
    ratioSD: sd(rows.map((row) => row.ratio)),
    ratioBelowOne: rows.filter((row) => row.ratio < 1).length,
    ratioBelowTwo: rows.filter((row) => row.ratio < 2).length,
  };
}

if (process.env.DD_SEED_DETAILS === "1") {
  const rows = SEEDS.map((seed) => ({
    seed,
    ...stats(curve(0.3, seed, 1280)),
  }));
  console.log(JSON.stringify(rows));
  process.exit(0);
}

for (const noise of [0.3, 0.5, 1]) {
  for (const maxDegree of [640, 1280, 2560]) {
    const started = performance.now();
    const rows = SEEDS.map((seed) =>
      stats(curve(noise, seed, maxDegree)),
    );
    console.log(JSON.stringify({
      noise,
      maxDegree,
      testSize: TEST_SIZE,
      seeds: SEEDS.length,
      runtimeMs: performance.now() - started,
      ...aggregate(rows),
    }));
  }
}
