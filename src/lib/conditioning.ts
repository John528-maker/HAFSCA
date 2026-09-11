/**
 * Measured κ(X) tables from docs/phase2-synthesis.md §2.2.
 * These are design-matrix condition numbers — not the regularized Gram
 * upper bound gramSize/RIDGE+1 used as a numerical-failure guard.
 */

export interface KappaRow {
  degree: number;
  kappa: number;
  note?: string;
}

/** Monomial basis + arcsine nodes — exponential growth. */
export const MONOMIAL_KAPPA: KappaRow[] = [
  { degree: 5, kappa: 4.6e1 },
  { degree: 10, kappa: 3.7e3 },
  { degree: 15, kappa: 3.0e5 },
  { degree: 20, kappa: 3.1e7 },
];

/**
 * Chebyshev + arcsine: flat at moderate degree. Late growth is p→n,
 * not "high degree is ill-conditioned."
 */
export const CHEBYSHEV_KAPPA: KappaRow[] = [
  { degree: 5, kappa: 1.8, note: "flat" },
  { degree: 10, kappa: 2.1, note: "flat" },
  { degree: 15, kappa: 2.4, note: "flat" },
  { degree: 20, kappa: 2.8, note: "flat" },
  { degree: 40, kappa: 16, note: "p approaching n" },
];

/** Same polynomials, uniform sampling — measure, not basis, drives κ. */
export const CHEBYSHEV_UNIFORM_KAPPA_AT_40 = 1.4e6;

/** Relative ridge floors κ(G+λI) near this once d ≳ 78. */
export const RIDGE_KAPPA_CEILING = 4.6e8;

export function formatKappa(value: number): string {
  if (value >= 1e4) return value.toExponential(1);
  if (value >= 100) return value.toFixed(0);
  return value.toFixed(1);
}
