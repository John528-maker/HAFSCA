import type { DataPoint, DatasetSplit } from "../types/experiment.ts";
import { createRng, gaussian, shuffleInPlace } from "./random.ts";

/** Ground-truth target on x ∈ [-1, 1]. */
export function trueFunction(x: number): number {
  return Math.sin(2 * Math.PI * x);
}

/**
 * Sample x from the arcsine (Chebyshev) distribution on [-1, 1]:
 *   x = cos(π U), U ~ Uniform(0,1)
 * This matches the orthogonality measure of Chebyshev features and keeps the
 * design matrix well-conditioned at high degree (uniform x does not).
 */
export function sampleInput(rng: () => number): number {
  const u = Math.min(1 - 1e-12, Math.max(1e-12, rng()));
  return Math.cos(Math.PI * u);
}

export function generateDataset(
  size: number,
  noiseLevel: number,
  seed: number,
): DataPoint[] {
  const rng = createRng(seed);
  const points: DataPoint[] = [];
  for (let i = 0; i < size; i++) {
    const x = sampleInput(rng);
    const y = trueFunction(x) + noiseLevel * gaussian(rng);
    points.push({ x, y });
  }
  return points;
}

export function trainTestSplit(
  data: DataPoint[],
  trainRatio: number,
  seed: number,
): DatasetSplit {
  const rng = createRng(seed + 10_000);
  const shuffled = data.map((p) => ({ ...p }));
  shuffleInPlace(shuffled, rng);
  const trainCount = Math.max(1, Math.floor(shuffled.length * trainRatio));
  const train = shuffled.slice(0, trainCount);
  const test = shuffled.slice(trainCount);
  if (test.length === 0) {
    throw new Error("trainTestSplit: test set is empty; use a larger dataset");
  }
  return { train, test, all: data };
}

export function buildDataset(
  size: number,
  noiseLevel: number,
  trainRatio: number,
  seed: number,
): DatasetSplit {
  const all = generateDataset(size, noiseLevel, seed);
  return trainTestSplit(all, trainRatio, seed);
}
