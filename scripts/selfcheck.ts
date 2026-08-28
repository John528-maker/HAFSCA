/**
 * Assert-based self-check for the ML core.
 * Run: node --experimental-strip-types scripts/selfcheck.ts
 * (Node 24 strips TypeScript types natively — no test framework.)
 */
import { buildDataset, trueFunction } from "../src/lib/dataset.ts";
import {
  regularizedGramConditionUpperBound,
  vectorNorm,
} from "../src/lib/linalg.ts";
import { meanSquaredError } from "../src/lib/metrics.ts";
import { fitPolynomial, predict } from "../src/lib/regression.ts";
import {
  analyzeDoubleDescent,
  DD_THRESHOLDS,
  findInterpolationThreshold,
} from "../src/lib/analysis.ts";
import { defaultConfig, runExperiment } from "../src/lib/experiment.ts";
import type { ModelResult } from "../src/types/experiment.ts";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL  ${msg}`);
  }
}

function almostEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}

function syntheticResult(
  degree: number,
  trainMSE: number,
  testMSE: number,
  overrides: Partial<ModelResult> = {},
): ModelResult {
  return {
    degree,
    paramCount: degree + 1,
    trainMSE,
    testMSE,
    noisyTestMSE: testMSE,
    conditionNumberUpperBound: 1e9,
    generalizationGap: testMSE - trainMSE,
    coefficients: [],
    ...overrides,
  };
}

console.log("1. Exact recovery of a known linear target");
{
  // y = 2 + 3x, noiseless, degree-1 Chebyshev: T0=1, T1=x → coeffs [2, 3]
  const xs = [-1, -0.5, 0, 0.5, 1];
  const ys = xs.map((x) => 2 + 3 * x);
  const model = fitPolynomial(xs, ys, 1);
  const preds = predict(model, xs);
  const mse = meanSquaredError(preds, ys);
  assert(mse < 1e-10, `linear fit MSE ~ 0 (got ${mse})`);
  assert(almostEqual(model.coefficients[0]!, 2, 1e-7), `intercept ≈ 2 (got ${model.coefficients[0]})`);
  assert(almostEqual(model.coefficients[1]!, 3, 1e-7), `slope ≈ 3 (got ${model.coefficients[1]})`);
  const heldOutX = [-0.75, 0.25, 0.75];
  const heldOutPreds = predict(model, heldOutX);
  assert(
    heldOutPreds.every((value, i) =>
      almostEqual(value, 2 + 3 * heldOutX[i]!, 1e-7),
    ),
    "well-conditioned fit predicts correctly away from training points",
  );
}

console.log("2. Interpolation: trainMSE ≈ 0 once p > n");
{
  const data = buildDataset(30, 0.0, 0.8, 7);
  const trainX = data.train.map((p) => p.x);
  const trainY = data.train.map((p) => p.y);
  const n = trainX.length;
  // Overparameterized: degree = n (p = n+1 > n)
  const model = fitPolynomial(trainX, trainY, n);
  const preds = predict(model, trainX);
  const mse = meanSquaredError(preds, trainY);
  assert(mse < 1e-8, `overparameterized train MSE ≈ 0 (n=${n}, mse=${mse})`);
}

console.log("3. Min-norm property: overparameterized models interpolate; norms finite");
{
  const data = buildDataset(20, 0.05, 0.8, 99);
  const trainX = data.train.map((p) => p.x);
  const trainY = data.train.map((p) => p.y);
  const n = trainX.length;
  const m1 = fitPolynomial(trainX, trainY, n + 5);
  const m2 = fitPolynomial(trainX, trainY, n + 15);
  const n1 = vectorNorm(m1.coefficients);
  const n2 = vectorNorm(m2.coefficients);
  assert(Number.isFinite(n1) && Number.isFinite(n2), `norms finite (${n1}, ${n2})`);
  const mse1 = meanSquaredError(predict(m1, trainX), trainY);
  const mse2 = meanSquaredError(predict(m2, trainX), trainY);
  assert(mse1 < 1e-8, `degree n+5 interpolates (mse=${mse1})`);
  assert(mse2 < 1e-8, `degree n+15 interpolates (mse=${mse2})`);
}

console.log("4. Seed reproducibility");
{
  const a = buildDataset(50, 0.2, 0.8, 42);
  const b = buildDataset(50, 0.2, 0.8, 42);
  const same =
    a.train.length === b.train.length &&
    a.train.every((p, i) => p.x === b.train[i]!.x && p.y === b.train[i]!.y);
  assert(same, "identical seed → identical train split");
  const c = buildDataset(50, 0.2, 0.8, 43);
  const different = a.train.some((p, i) => p.x !== c.train[i]?.x || p.y !== c.train[i]?.y);
  assert(different, "different seed → different data");
}

console.log("5. trueFunction sanity");
{
  assert(almostEqual(trueFunction(0), 0, 1e-12), "sin(0)=0");
  assert(almostEqual(trueFunction(0.25), 1, 1e-12), "sin(π/2)=1");
}

console.log("6. findInterpolationThreshold");
{
  const fake: ModelResult[] = [
    syntheticResult(1, 1, 1.1),
    syntheticResult(5, 0.01, 0.05),
    syntheticResult(10, 1e-4, 0.2),
  ];
  assert(findInterpolationThreshold(fake, 1e-3) === 10, "threshold at degree 10");
  assert(findInterpolationThreshold(fake, 1e-6) === null, "no threshold if never crossed");
}

console.log("7. analyzeDoubleDescent shape detection");
{
  // Synthesize a clear U → peak → second descent
  const degrees = Array.from({ length: 40 }, (_, i) => i + 1);
  const clear: ModelResult[] = degrees.map((d) => {
    let test: number;
    if (d < 10) test = 1.0 - d * 0.05; // descend to ~0.5
    else if (d < 20) test = 0.5 + (d - 10) * 0.15; // rise to ~2.0
    else if (d < 33) test = 2.0 - (d - 20) * 0.13; // second descent to ~0.4
    else test = 0.44 + (d - 32) * 0.03; // turn upward after an interior minimum
    return syntheticResult(
      d,
      Math.max(1e-6, 0.5 - d * 0.02),
      Math.max(0.05, test),
    );
  });
  assert(
    analyzeDoubleDescent(clear, 460) === "True Double Descent",
    `well-sampled synthetic DD is true DD (got ${analyzeDoubleDescent(clear, 460)})`,
  );
  assert(
    analyzeDoubleDescent(clear, 10) === "Competitive Second Descent",
    "10-point test set cannot produce a True verdict",
  );

  const flat: ModelResult[] = degrees.map((d) =>
    syntheticResult(d, 0.1, 0.2),
  );
  assert(
    analyzeDoubleDescent(flat) === "No Second Descent Observed",
    "flat curve → No Second Descent Observed",
  );

  const truncated: ModelResult[] = degrees.map((d) => {
    const testMSE =
      d < 10
        ? 1 - d * 0.05
        : d < 20
          ? 0.5 + (d - 10) * 0.15
          : 2 - (d - 20) * 0.06;
    return syntheticResult(
      d,
      Math.max(1e-6, 0.5 - d * 0.02),
      testMSE,
    );
  });
  assert(
    analyzeDoubleDescent(truncated) === "Sweep Range Exhausted",
    "descending sweep endpoint → Sweep Range Exhausted",
  );
}

console.log("8. Truncated high-degree run is not double descent");
{
  const data = buildDataset(100, 0.2, 0.8, 42);
  const trainX = data.train.map((p) => p.x);
  const trainY = data.train.map((p) => p.y);
  const testX = data.test.map((p) => p.x);
  const testY = data.test.map((p) => p.y);
  const degrees = [1, 5, 9, 13, 50, 75, 80, 120, 160];
  const highDegreeRun: ModelResult[] = degrees.map((degree) => {
    const model = fitPolynomial(trainX, trainY, degree);
    const trainMSE = meanSquaredError(predict(model, trainX), trainY);
    const testMSE = meanSquaredError(predict(model, testX), testY);
    return syntheticResult(degree, trainMSE, testMSE, {
      paramCount: model.paramCount,
      noisyTestMSE: testMSE,
      conditionNumberUpperBound: regularizedGramConditionUpperBound(
        trainX.length,
        model.paramCount,
      ),
      coefficients: model.coefficients,
    });
  });
  const verdict = analyzeDoubleDescent(highDegreeRun);
  assert(
    verdict === "Sweep Range Exhausted",
    `still-falling high-degree run → range exhausted (got ${verdict})`,
  );
  assert(
    verdict !== "True Double Descent" &&
      verdict !== "Competitive Second Descent",
    "truncated run is not classified as double descent",
  );
}

console.log("9. Variance explosion is distinct from numerical failure");
{
  const partial: ModelResult[] = Array.from({ length: 40 }, (_, index) => {
    const degree = index + 1;
    const testMSE =
      degree < 10
        ? 1 - degree * 0.05
        : degree < 20
          ? 0.5 + (degree - 10) * 100
          : degree < 31
            ? 1000 - (degree - 20) * 80
            : 200 + (degree - 30) * 10;
    return syntheticResult(degree, 1e-6, testMSE);
  });
  assert(
    analyzeDoubleDescent(partial) === "Partial Recovery",
    "large finite variance explosion with recovery → Partial Recovery",
  );
  assert(
    analyzeDoubleDescent(partial) !== "Numerical Failure",
    "genuine finite variance explosion is not a numerical failure",
  );

  const nonFinite = partial.map((result) => ({ ...result }));
  nonFinite[20] = { ...nonFinite[20]!, testMSE: Number.POSITIVE_INFINITY };
  assert(
    analyzeDoubleDescent(nonFinite) === "Numerical Failure",
    "non-finite test error → Numerical Failure",
  );
}

console.log("10. Honest wide-sweep default");
{
  const config = defaultConfig();
  assert(
    config.datasetSize === 500 &&
      config.trainRatio === 0.08 &&
      config.noiseLevel === 0.3 &&
      config.randomSeed === 1 &&
      config.maxComplexity === 1280,
    "default uses representative seed 1, 40/460 split, and a wide sweep",
  );
  const result = await runExperiment(defaultConfig());
  const nTrain = result.dataset.train.length;
  assert(
    nTrain === 40 && result.dataset.test.length === 460,
    `default split is 40 train / 460 test (got ${nTrain} / ${result.dataset.test.length})`,
  );
  assert(
    result.summary.doubleDescentStatus !== "True Double Descent" &&
      result.summary.doubleDescentStatus !== "Competitive Second Descent",
    `default does not claim competitive DD (got ${result.summary.doubleDescentStatus})`,
  );
  assert(
    result.summary.interpolationThreshold === nTrain - 1,
    `default reports theoretical interpolation degree ${nTrain - 1}`,
  );
  assert(
    result.summary.testEstimateReliable,
    "default test estimate passes the 160-point reliability floor",
  );
  assert(
    result.results.every(
      (model) =>
        Number.isFinite(model.testMSE) &&
        Number.isFinite(model.noisyTestMSE) &&
        Number.isFinite(model.conditionNumberUpperBound),
    ),
    "dual test metrics and conditioning bounds are finite",
  );
  assert(
    result.summary.minTestError < result.summary.minNoisyTestError,
    `truth-target minimum is below noisy-label minimum (${result.summary.minTestError} < ${result.summary.minNoisyTestError})`,
  );
}

console.log("11. Interpolation threshold is noise-independent");
{
  for (const datasetSize of [20, 50, 100]) {
    const expected = Math.floor(datasetSize * 0.8) - 1;
    for (const noiseLevel of [0.2, 0.5, 1]) {
      const result = await runExperiment({
        datasetSize,
        noiseLevel,
        trainRatio: 0.8,
        maxComplexity: expected,
        randomSeed: 42,
      });
      assert(
        result.summary.interpolationThreshold === expected,
        `N=${datasetSize}, sigma=${noiseLevel} reports degree ${expected} (got ${result.summary.interpolationThreshold})`,
      );
    }
  }
}

console.log("12. Detection calibration constants");
{
  assert(
    DD_THRESHOLDS.COMPETITIVE_SECOND_MIN === 2 &&
      DD_THRESHOLDS.MAX_FORWARD_ERROR_BOUND === 1e-2,
    "competitive boundary and precision budget remain documented",
  );
  assert(
    DD_THRESHOLDS.MIN_RELIABLE_TEST_SIZE === 160,
    "True verdict requires at least 160 test points",
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
