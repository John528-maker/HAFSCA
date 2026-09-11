import type {
  ExperimentConfig,
  ExperimentResult,
  ExperimentSummaryData,
  ModelResult,
} from "../types/experiment.ts";
import {
  analyzeDoubleDescent,
  buildAnalysisNotes,
  DD_THRESHOLDS,
} from "./analysis.ts";
import { buildDataset, trueFunction } from "./dataset.ts";
import { regularizedGramConditionUpperBound } from "./linalg.ts";
import { generalizationGap, meanSquaredError } from "./metrics.ts";
import { fitPolynomial, predict } from "./regression.ts";

/** Tunable experiment constants — change here, not scattered through UI. */
export const EXPERIMENT_CONFIG = {
  DEFAULT_DATASET_SIZE: 500,
  DEFAULT_NOISE: 0.3,
  DEFAULT_SEED: 1,
  DEFAULT_TRAIN_RATIO: 0.08,
  DATASET_SIZE_OPTIONS: [20, 50, 100, 200, 500] as const,
  MAX_COMPLEXITY_HARD_CAP: 1280,
  /** Target number of degree evaluations before we start striding. */
  TARGET_GRID_POINTS: 120,
  /** Half-width of the dense window around the interpolation threshold. */
  DENSE_WINDOW: 15,
} as const;

export function defaultConfig(): ExperimentConfig {
  const datasetSize = EXPERIMENT_CONFIG.DEFAULT_DATASET_SIZE;
  const nTrain = Math.floor(datasetSize * EXPERIMENT_CONFIG.DEFAULT_TRAIN_RATIO);
  return {
    datasetSize,
    noiseLevel: EXPERIMENT_CONFIG.DEFAULT_NOISE,
    maxComplexity: defaultMaxComplexity(nTrain),
    trainRatio: EXPERIMENT_CONFIG.DEFAULT_TRAIN_RATIO,
    randomSeed: EXPERIMENT_CONFIG.DEFAULT_SEED,
  };
}

export function defaultMaxComplexity(nTrain: number): number {
  return Math.min(32 * nTrain, EXPERIMENT_CONFIG.MAX_COMPLEXITY_HARD_CAP);
}

export function sliderMaxComplexity(nTrain: number): number {
  return Math.min(
    32 * nTrain + 20,
    EXPERIMENT_CONFIG.MAX_COMPLEXITY_HARD_CAP,
  );
}

/**
 * Degree grid that is dense through the interpolation threshold (degree =
 * nTrain - 1) and may stride afterward. Keeping the full low-degree region is
 * necessary to measure the first minimum used in the DD ratio faithfully.
 */
export function degreeGrid(nTrain: number, maxComplexity: number): number[] {
  const maxDeg = Math.max(1, Math.min(maxComplexity, EXPERIMENT_CONFIG.MAX_COMPLEXITY_HARD_CAP));
  const thresholdDeg = nTrain - 1;
  const denseHi = Math.min(maxDeg, thresholdDeg + EXPERIMENT_CONFIG.DENSE_WINDOW);

  if (maxDeg <= EXPERIMENT_CONFIG.TARGET_GRID_POINTS) {
    return Array.from({ length: maxDeg }, (_, i) => i + 1);
  }

  const stride = Math.max(1, Math.ceil(maxDeg / EXPERIMENT_CONFIG.TARGET_GRID_POINTS));
  const set = new Set<number>();
  for (let d = 1; d <= maxDeg; d += stride) set.add(d);
  set.add(maxDeg);
  for (let d = 1; d <= denseHi; d++) set.add(d);
  return Array.from(set).sort((a, b) => a - b);
}

export interface RunProgress {
  completed: number;
  total: number;
  currentDegree: number;
}

/**
 * Run a full complexity sweep.
 * Ponytail: yields between models for UI responsiveness. If sweeps grow past
 * ~few hundred degrees, move this loop into a Web Worker.
 */
export async function runExperiment(
  config: ExperimentConfig,
  onProgress?: (p: RunProgress) => void,
): Promise<ExperimentResult> {
  if (config.datasetSize < 10) {
    throw new Error("Dataset size must be at least 10");
  }
  if (config.noiseLevel < 0 || config.noiseLevel > 1) {
    throw new Error("Noise level must be between 0 and 1");
  }
  if (config.maxComplexity < 1) {
    throw new Error("Max complexity must be at least 1");
  }

  const dataset = buildDataset(
    config.datasetSize,
    config.noiseLevel,
    config.trainRatio,
    config.randomSeed,
  );

  const nTrain = dataset.train.length;
  const trainX = dataset.train.map((p) => p.x);
  const trainY = dataset.train.map((p) => p.y);
  const testX = dataset.test.map((p) => p.x);
  const noisyTestY = dataset.test.map((p) => p.y);
  const trueTestY = testX.map(trueFunction);

  const degrees = degreeGrid(nTrain, config.maxComplexity);
  const results: ModelResult[] = [];

  for (let i = 0; i < degrees.length; i++) {
    const degree = degrees[i]!;
    onProgress?.({ completed: i, total: degrees.length, currentDegree: degree });

    try {
      const model = fitPolynomial(trainX, trainY, degree);
      const trainPred = predict(model, trainX);
      const testPred = predict(model, testX);
      const trainMSE = meanSquaredError(trainPred, trainY);
      const testMSE = meanSquaredError(testPred, trueTestY);
      const noisyTestMSE = meanSquaredError(testPred, noisyTestY);
      results.push({
        degree,
        paramCount: model.paramCount,
        trainMSE,
        testMSE,
        noisyTestMSE,
        conditionNumberUpperBound: regularizedGramConditionUpperBound(
          nTrain,
          model.paramCount,
        ),
        // Keep this comparison label-to-label; the primary truth metric has no
        // directly comparable noisy training target.
        generalizationGap: generalizationGap(noisyTestMSE, trainMSE),
        coefficients: model.coefficients,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed at degree ${degree}: ${msg}`);
    }

    // Yield so React can paint progress.
    await new Promise((r) => setTimeout(r, 0));
  }

  onProgress?.({
    completed: degrees.length,
    total: degrees.length,
    currentDegree: degrees[degrees.length - 1]!,
  });

  const thresholdDegIdeal = nTrain - 1;
  const thresholdBeyondSweep = thresholdDegIdeal > config.maxComplexity;
  /*
   * Interpolation is a parameter-count fact: p=n at degree nTrain-1. The
   * relative ridge deliberately leaves train MSE around 1e-4–1e-3 there, so
   * an empirical MSE crossing moves with noise and conditioning. Report the
   * known theoretical threshold; train MSE remains visible as corroboration.
   */
  const interpolationThreshold = thresholdBeyondSweep ? null : thresholdDegIdeal;
  const testSize = dataset.test.length;
  const doubleDescentStatus = analyzeDoubleDescent(
    results,
    testSize,
    thresholdDegIdeal,
  );
  const analysisNotes = buildAnalysisNotes(
    results,
    interpolationThreshold,
    doubleDescentStatus,
  );

  const best = results.reduce((a, b) => (b.testMSE < a.testMSE ? b : a));
  const bestNoisy = results.reduce((a, b) =>
    b.noisyTestMSE < a.noisyTestMSE ? b : a,
  );
  const minTrain = results.reduce((a, b) => (b.trainMSE < a.trainMSE ? b : a));
  const summary: ExperimentSummaryData = {
    datasetSize: config.datasetSize,
    testSize,
    testEstimateReliable:
      testSize >= DD_THRESHOLDS.MIN_RELIABLE_TEST_SIZE,
    noiseLevel: config.noiseLevel,
    randomSeed: config.randomSeed,
    bestComplexity: best.degree,
    minTrainError: minTrain.trainMSE,
    minTestError: best.testMSE,
    minNoisyTestError: bestNoisy.noisyTestMSE,
    interpolationThreshold,
    doubleDescentStatus,
    thresholdBeyondSweep,
  };

  return {
    id: `exp_${Date.now()}_${config.randomSeed}`,
    createdAt: Date.now(),
    config,
    dataset,
    results,
    summary,
    analysisNotes,
  };
}
