import { matVec, minNormLeastSquares } from "./linalg.ts";

/**
 * Chebyshev polynomials of the first kind on [-1, 1]:
 *   T0 = 1, T1 = x, T_{k+1} = 2 x T_k - T_{k-1}
 * Same polynomial span as monomials / Legendre of equal degree, but paired with
 * arcsine-distributed inputs they stay numerically stable at high degree.
 */
export function chebyshevFeatures(x: number, degree: number): number[] {
  const features = new Array<number>(degree + 1);
  features[0] = 1;
  if (degree >= 1) features[1] = x;
  for (let k = 1; k < degree; k++) {
    features[k + 1] = 2 * x * features[k]! - features[k - 1]!;
  }
  return features;
}

export function buildDesignMatrix(xs: number[], degree: number): number[][] {
  return xs.map((x) => chebyshevFeatures(x, degree));
}

export interface FittedModel {
  degree: number;
  coefficients: number[];
  paramCount: number;
}

export function fitPolynomial(
  xs: number[],
  ys: number[],
  degree: number,
): FittedModel {
  if (xs.length !== ys.length || xs.length === 0) {
    throw new Error("fitPolynomial: empty or mismatched training data");
  }
  if (degree < 0) throw new Error("fitPolynomial: degree must be >= 0");
  const X = buildDesignMatrix(xs, degree);
  const coefficients = minNormLeastSquares(X, ys);
  return { degree, coefficients, paramCount: degree + 1 };
}

export function predict(model: FittedModel, xs: number[]): number[] {
  const X = buildDesignMatrix(xs, model.degree);
  return matVec(X, model.coefficients);
}

export function predictOne(model: FittedModel, x: number): number {
  return predict(model, [x])[0]!;
}
