export function meanSquaredError(
  predictions: number[],
  actual: number[],
): number {
  if (predictions.length === 0 || predictions.length !== actual.length) {
    throw new Error("meanSquaredError: length mismatch or empty arrays");
  }
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const d = predictions[i]! - actual[i]!;
    sum += d * d;
  }
  return sum / predictions.length;
}

export function generalizationGap(testMSE: number, trainMSE: number): number {
  return testMSE - trainMSE;
}
