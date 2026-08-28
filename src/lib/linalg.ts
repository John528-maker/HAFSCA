/**
 * Linear algebra for minimum-norm least squares.
 * Primary path: tiny ridge + Gaussian elimination with partial pivoting.
 * Fallback: symmetric Jacobi eigendecomposition + Moore–Penrose pseudo-inverse.
 *
 * A small ridge (RIDGE) keeps the Gram matrix safely invertible in float64
 * without erasing the interpolation / double-descent phenomenology.
 */

/** Relative pivot / eigenvalue cutoff for the pseudo-inverse fallback. */
export const RCOND = 1e-12;

/**
 * Relative ridge on the Gram matrix. Scaling by the mean diagonal keeps the
 * Tikhonov regularization dimensionless as the polynomial degree changes.
 * 1e-8 is small enough to leave well-conditioned fits unchanged while
 * preventing near-null Gram modes from amplifying round-off and label noise.
 */
export const RIDGE = 1e-8;

/**
 * Solve min-norm least squares: argmin ||X θ - y||₂ with min ||θ||₂.
 * - p ≤ n: θ = (X'X + λI)^{-1} X'y
 * - p > n: α = (XX' + λI)^{-1} y, θ = X' α
 */
export function minNormLeastSquares(X: number[][], y: number[]): number[] {
  const n = X.length;
  if (n === 0) throw new Error("minNormLeastSquares: empty design matrix");
  const p = X[0]!.length;
  if (y.length !== n) throw new Error("minNormLeastSquares: y length mismatch");

  if (p <= n) {
    const XtX = matMul(transpose(X), X);
    addRelativeRidge(XtX);
    const Xty = matVec(transpose(X), y);
    return solveSymmetric(XtX, Xty);
  }

  const K = matMul(X, transpose(X));
  addRelativeRidge(K);
  const alpha = solveSymmetric(K, y);
  return matVec(transpose(X), alpha);
}

function addRelativeRidge(A: number[][]): void {
  let trace = 0;
  for (let i = 0; i < A.length; i++) trace += A[i]![i]!;
  const lambda = RIDGE * (trace / A.length);
  for (let i = 0; i < A.length; i++) A[i]![i]! += lambda;
}

function solveSymmetric(A: number[][], b: number[]): number[] {
  const ge = solveGE(A, b);
  if (ge !== null) return ge;
  return solveViaEig(A, b);
}

/** Gaussian elimination with partial pivoting. Null if singular. */
export function solveGE(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]!]);

  let maxPivot = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      maxPivot = Math.max(maxPivot, Math.abs(A[i]![j]!));
    }
  }
  const cutoff = RCOND * Math.max(maxPivot, 1e-30);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let pivotVal = Math.abs(M[col]![col]!);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r]![col]!);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = r;
      }
    }
    if (pivotVal < cutoff) return null;

    if (pivotRow !== col) {
      const tmp = M[col]!;
      M[col] = M[pivotRow]!;
      M[pivotRow] = tmp;
    }

    const piv = M[col]![col]!;
    for (let r = col + 1; r < n; r++) {
      const f = M[r]![col]! / piv;
      for (let c = col; c <= n; c++) {
        M[r]![c]! -= f * M[col]![c]!;
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i]![n]!;
    for (let j = i + 1; j < n; j++) s -= M[i]![j]! * x[j]!;
    const piv = M[i]![i]!;
    if (Math.abs(piv) < cutoff) return null;
    x[i] = s / piv;
  }
  return x;
}

export function jacobiEigendecomposition(A: number[][]): {
  eigenvalues: number[];
  eigenvectors: number[][];
} {
  const n = A.length;
  const a = A.map((row) => row.slice());
  const v: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array<number>(n).fill(0);
    row[i] = 1;
    return row;
  });

  const maxSweeps = 60;
  const eps = 1e-14;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        off += Math.abs(a[i]![j]!);
      }
    }
    if (off < eps * n * Math.max(1, maxAbsDiag(a))) break;

    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p]![q]!;
        if (Math.abs(apq) < eps) continue;

        const app = a[p]![p]!;
        const aqq = a[q]![q]!;
        let t: number;
        if (Math.abs(app - aqq) < eps) {
          t = 1;
        } else {
          const theta = (0.5 * (aqq - app)) / apq;
          t =
            Math.abs(theta) > 1e12
              ? 0.5 / theta
              : 1 /
                (theta +
                  Math.sign(theta || 1) * Math.sqrt(1 + theta * theta));
        }
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;

        a[p]![p] = app - t * apq;
        a[q]![q] = aqq + t * apq;
        a[p]![q] = 0;
        a[q]![p] = 0;

        for (let r = 0; r < n; r++) {
          if (r === p || r === q) continue;
          const arp = a[r]![p]!;
          const arq = a[r]![q]!;
          a[r]![p] = c * arp - s * arq;
          a[p]![r] = a[r]![p]!;
          a[r]![q] = s * arp + c * arq;
          a[q]![r] = a[r]![q]!;
        }

        for (let r = 0; r < n; r++) {
          const vrp = v[r]![p]!;
          const vrq = v[r]![q]!;
          v[r]![p] = c * vrp - s * vrq;
          v[r]![q] = s * vrp + c * vrq;
        }
      }
    }
  }

  return {
    eigenvalues: a.map((row, i) => row[i]!),
    eigenvectors: v,
  };
}

function maxAbsDiag(a: number[][]): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]![i]!));
  return m;
}

function solveViaEig(A: number[][], b: number[]): number[] {
  const { eigenvalues, eigenvectors: V } = jacobiEigendecomposition(A);
  const m = eigenvalues.length;
  const maxAbs = Math.max(...eigenvalues.map(Math.abs), 1e-30);
  const cutoff = RCOND * maxAbs;

  const Vt_b = new Array<number>(m).fill(0);
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let r = 0; r < m; r++) s += V[r]![i]! * b[r]!;
    Vt_b[i] = s;
  }

  const inv = new Array<number>(m).fill(0);
  for (let i = 0; i < m; i++) {
    const lam = eigenvalues[i]!;
    inv[i] = Math.abs(lam) > cutoff ? Vt_b[i]! / lam : 0;
  }

  const x = new Array<number>(m).fill(0);
  for (let r = 0; r < m; r++) {
    let s = 0;
    for (let i = 0; i < m; i++) s += V[r]![i]! * inv[i]!;
    x[r] = s;
  }
  return x;
}

export function transpose(A: number[][]): number[][] {
  const n = A.length;
  const p = A[0]!.length;
  const T: number[][] = Array.from({ length: p }, () => new Array<number>(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) T[j]![i] = A[i]![j]!;
  }
  return T;
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const k = A[0]!.length;
  const m = B[0]!.length;
  const C: number[][] = Array.from({ length: n }, () =>
    new Array<number>(m).fill(0),
  );
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < k; t++) {
      const a = A[i]![t]!;
      for (let j = 0; j < m; j++) C[i]![j]! += a * B[t]![j]!;
    }
  }
  return C;
}

export function matVec(A: number[][], x: number[]): number[] {
  const n = A.length;
  const p = A[0]!.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += A[i]![j]! * x[j]!;
    y[i] = s;
  }
  return y;
}

export function vectorNorm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}
