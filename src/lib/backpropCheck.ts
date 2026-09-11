import { sigmoid, sigmoidPrime } from "./activations.ts";

export const BACKPROP_CHECK_DEFAULTS = {
  x: 0.5,
  w: 1.2,
  b: -0.3,
  y: 0.2,
  h: 1e-5,
} as const;

export interface BackpropCheckInput {
  x: number;
  w: number;
  b: number;
  y: number;
  h: number;
}

export interface BackpropCheckResult {
  z: number;
  yHat: number;
  loss: number;
  dLossDw: number;
  dLossDb: number;
  fdW: number;
  fdB: number;
  relErrW: number;
  relErrB: number;
}

function lossAt(x: number, w: number, b: number, y: number): number {
  const yHat = sigmoid(w * x + b);
  const r = yHat - y;
  return r * r;
}

function relativeError(analytic: number, finite: number): number {
  const scale = Math.max(Math.abs(analytic), Math.abs(finite), 1e-12);
  return Math.abs(analytic - finite) / scale;
}

/**
 * One-sample squared residual J = (σ(wx+b) − y)².
 * Residual is prediction minus target. Not a trained net.
 */
export function runBackpropCheck(input: BackpropCheckInput): BackpropCheckResult {
  const { x, w, b, y, h } = input;
  const step = Math.max(Math.abs(h), 1e-12);
  const z = w * x + b;
  const yHat = sigmoid(z);
  const loss = (yHat - y) ** 2;
  const dYHat = sigmoidPrime(z);
  const dLossDw = 2 * (yHat - y) * dYHat * x;
  const dLossDb = 2 * (yHat - y) * dYHat;
  const fdW = (lossAt(x, w + step, b, y) - lossAt(x, w - step, b, y)) / (2 * step);
  const fdB = (lossAt(x, w, b + step, y) - lossAt(x, w, b - step, y)) / (2 * step);
  return {
    z,
    yHat,
    loss,
    dLossDw,
    dLossDb,
    fdW,
    fdB,
    relErrW: relativeError(dLossDw, fdW),
    relErrB: relativeError(dLossDb, fdB),
  };
}
