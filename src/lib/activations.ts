export type ActivationName =
  | "identity"
  | "sigmoid"
  | "tanh"
  | "relu"
  | "leaky-relu"
  | "elu"
  | "softplus"
  | "silu";

export const ACTIVATION_NAMES: ActivationName[] = [
  "identity",
  "sigmoid",
  "tanh",
  "relu",
  "leaky-relu",
  "elu",
  "softplus",
  "silu",
];

/** Stable sigmoid: never exp(+large). */
export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

export function sigmoidPrime(z: number): number {
  const s = sigmoid(z);
  return s * (1 - s);
}

export function activationPhi(
  name: ActivationName,
  z: number,
  alpha = 0.01,
): number {
  switch (name) {
    case "identity":
      return z;
    case "sigmoid":
      return sigmoid(z);
    case "tanh":
      return Math.tanh(z);
    case "relu":
      return z > 0 ? z : 0;
    case "leaky-relu":
      return z >= 0 ? z : alpha * z;
    case "elu":
      return z > 0 ? z : alpha * Math.expm1(z);
    case "softplus":
      return z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z));
    case "silu":
      return z * sigmoid(z);
  }
}

/**
 * Site conventions at kinks: ReLU φ'(0)=0, leaky ReLU φ'(0)=1.
 * Not a claim about any other framework.
 */
export function activationPhiPrime(
  name: ActivationName,
  z: number,
  alpha = 0.01,
): number {
  switch (name) {
    case "identity":
      return 1;
    case "sigmoid":
      return sigmoidPrime(z);
    case "tanh": {
      const t = Math.tanh(z);
      return 1 - t * t;
    }
    case "relu":
      return z > 0 ? 1 : 0;
    case "leaky-relu":
      return z >= 0 ? 1 : alpha;
    case "elu":
      return z > 0 ? 1 : alpha * Math.exp(z);
    case "softplus":
      return sigmoid(z);
    case "silu": {
      const s = sigmoid(z);
      return s * (1 + z * (1 - s));
    }
  }
}

export function sampleActivationCurve(
  name: ActivationName,
  zMin: number,
  zMax: number,
  n = 401,
  alpha = 0.01,
): Array<{ z: number; phi: number; dphi: number }> {
  const out: Array<{ z: number; phi: number; dphi: number }> = [];
  const span = zMax - zMin;
  for (let i = 0; i < n; i++) {
    const z = zMin + (span * i) / (n - 1);
    out.push({
      z,
      phi: activationPhi(name, z, alpha),
      dphi: activationPhiPrime(name, z, alpha),
    });
  }
  return out;
}

export interface ChainStep {
  layer: number;
  a: number;
  z: number;
  dphi: number;
  factor: number;
  delta: number;
}

export function runActivationChain(
  name: ActivationName,
  depth: number,
  w: number,
  b: number,
  a0: number,
  alpha = 0.01,
): { steps: ChainStep[]; exploded: boolean } {
  const steps: ChainStep[] = [];
  let a = a0;
  let delta = 1;
  let exploded = false;
  for (let layer = 1; layer <= depth; layer++) {
    const z = w * a + b;
    const dphi = activationPhiPrime(name, z, alpha);
    const factor = dphi * w;
    const nextA = activationPhi(name, z, alpha);
    const nextDelta = factor * delta;
    if (!Number.isFinite(nextA) || !Number.isFinite(nextDelta)) {
      exploded = true;
      break;
    }
    a = nextA;
    delta = nextDelta;
    steps.push({ layer, a, z, dphi, factor, delta });
  }
  return { steps, exploded };
}

export function reluDeadFraction(
  w: number,
  b: number,
  n = 40,
): { fraction: number; xs: number[]; zs: number[] } {
  const xs: number[] = [];
  const zs: number[] = [];
  let dead = 0;
  for (let i = 0; i < n; i++) {
    const x = -2 + (4 * (i + 0.5)) / n;
    const z = w * x + b;
    xs.push(x);
    zs.push(z);
    if (z <= 0) dead += 1;
  }
  return { fraction: dead / n, xs, zs };
}

export const SIGMOID_SATURATION_Z = Math.log(99);
