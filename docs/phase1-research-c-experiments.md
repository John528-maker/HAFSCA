# Phase 1 — Research C: Interactive Experiments

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Branch:** `ml-platform-v2`
**Date:** 2026-08-28
**Role:** research and design only. No source was modified except this document.
**Prerequisite reading:** `docs/phase0-project-audit.md`, `src/lib/*`, `src/components/Experiment*.tsx`, `src/types/experiment.ts`.

This spec designs the next interactive ML labs so they **extend the existing double-descent experiment**, not replace it with a parallel stack. Engineers implement from here; a reviewer checks the math first.

> **[VERIFIED 2026-08-28]** A verification pass measured this spec against the real engine. Results, in order of how much they change what you build:
>
> - **§3 (gradient descent) is fully verified** and its acceptance tests are shippable verbatim. See the box at the head of §3.
> - **§2.4 contained a residual-sign contradiction with §3.4** that would have made gradient descent *ascend*. Fixed; see the warning at §2.4.
> - **§4.2's "best degree is 3" claim is measurably wrong** (argmin is 4; 3/4/5 are a 4.5% plateau) and the lab is **seed-fragile** (at seed 1 it shows no overfitting at all). See §4.2.
> - **The engine's ridge is relative, not absolute**, which stales every `RIDGE = 1e-10` reference and blocks the λ slider spec until an absolute-vs-relative decision is made (§4.3, §11.2).
> - **§7's variance divisor is settled at \(M-1\)**, and a second-order bias in the plug-in bias² estimator was found (§7.4). §7's numerical safety under its \(d\le12\) cap is **confirmed** (§7.9).
>
> Inline markers `**[VERIFIED 2026-08-28]**` / `**[CORRECTED 2026-08-28]**` show exactly what was audited. Open items are re-classified in §13.

---

## 0. The existing pattern (must be reused)

There is one shipped experiment: **double descent in polynomial regression**. It is a complete, proven loop. New labs copy this loop and vary only the config, the solver call, and the charts.

### 0.1 Data flow

```
ExperimentConfig  →  runExperiment(config, onProgress)  →  ExperimentResult
                                                              │
                    ┌─────────────────────────────────────────┤
                    ▼            ▼              ▼             ▼
              DatasetSplit   ModelResult[]   Summary     analysisNotes
                    │            │              │             │
                    ▼            ▼              ▼             ▼
              DatasetChart   ErrorChart    Experiment    AnalysisPanel
                             ModelExplorer  Summary      (locale recompute)
```

| Layer | File | Job |
| --- | --- | --- |
| Domain types | `src/types/experiment.ts` | `ExperimentConfig`, `DataPoint`, `DatasetSplit`, `ModelResult`, `ExperimentResult`, `ExperimentSummaryData`, `HistoryEntry` |
| Defaults / constants | `src/lib/experiment.ts` `EXPERIMENT_CONFIG` | Centralized magic numbers. UI reads them; it does not invent ranges. |
| PRNG / noise | `src/lib/random.ts` | Mulberry32, Box–Muller `N(0,1)`, Fisher–Yates |
| Dataset | `src/lib/dataset.ts` | `y = sin(2πx) + σ·ε` on `x ∈ [-1,1]`, arcsine sampling `x = cos(πU)`, 80/20 split |
| Features + fit | `src/lib/regression.ts` | Chebyshev `T_k`, `fitPolynomial` → `minNormLeastSquares` |
| Linear algebra | `src/lib/linalg.ts` | Primal / dual ridge-LS, GE + Jacobi fallback, **[CORRECTED 2026-08-28]** `RIDGE = 1e-8` applied **relative to the mean Gram diagonal** (lines 19, 45-50), not an absolute `1e-10` |
| Metrics | `src/lib/metrics.ts` | `MSE = (1/n) Σ (ŷ − y)²`, `gap = testMSE − trainMSE` |
| Analysis | `src/lib/analysis.ts` | Interpolation cutoff, DD verdict, notes **only from patterns that are present** |
| Orchestration | `src/lib/experiment.ts` `runExperiment` | Validate → build data → loop grid → fit/predict/score → yield → summarize |
| UI hub | `src/components/ExperimentWorkspace.tsx` | Six state slices: `config`, `result`, `selectedDegree`, `running`, `progress`, `error`, `history` |
| Controls | `src/components/ExperimentSettings.tsx` | Typed `config` + `onChange` + `onRun` + progress bar. Private `Field`. |
| Charts | `DatasetChart`, `ErrorChart`, `ModelExplorer` | Recharts, `isAnimationActive={false}`, train `#2563eb` / test `#dc2626`. Log axis clamped at `1e-12` with raw values in the tooltip. |
| Persistence | `src/lib/history.ts` | `localStorage`, cap 30, restore **settings** not the full result |

### 0.2 Rules the current code already follows (keep them)

1. **Config is a small typed object.** Defaults live next to the runner (`defaultConfig()`), not in JSX.
2. **The engine is pure and deterministic.** Same seed → same dataset and split (`selfcheck.ts`). No `Math.random`.
3. **Fit once, store coefficients, re-predict for charts.** `ModelExplorer` does not refit; it calls `predict(model, xs)` on 201 grid points in `[-1, 1]`.
4. **Charts are dumb views.** They receive `dataset` / `results` / `selected`. They do not own the solver.
5. **Batch work yields.** `await new Promise(r => setTimeout(r, 0))` between degrees so React can paint progress. Comment already names the ceiling: move to a Web Worker if the grid grows.
6. **Honest analysis.** `buildAnalysisNotes` emits a sentence only when a numeric predicate holds. The UI must never invent a phenomenon.
7. **Train / test color convention** is already a CSS token (`--train`, `--test`, `--threshold`) even though charts currently ignore it and hardcode hex. New charts must use the tokens (audit T3).
8. **Empty states** are dashed cards with a one-line prompt, not blank space.

### 0.3 Two modes new labs will need (the current lab only has one)

The shipped lab is **batch**: the student sets knobs, clicks Run, waits, then inspects. That is right for a complexity *sweep*. It is wrong for “drag a point and watch the line move.”

| Mode | When | Lifecycle |
| --- | --- | --- |
| **Live** | Closed form or O(n) update (linear regression, activations, capped-degree fit) | Every control change recomputes. No Run button. Reset restores `defaultConfig()`. |
| **Batch** | Sweeps, resampling, long GD playback | Current pattern: Run + `onProgress` + yield / worker. Pause/cancel required if animated. |

Do **not** invent a second workspace architecture. Add `mode: "live" | "batch"` to a shared `ExperimentDefinition` (audit R1) and keep the same hub states. Live labs simply never set `running`.

### 0.4 The bug this spec must not clone

Default double-descent run (N=100, noise=0.2, seed=42, max degree 160): test MSE peaks at ~1.7×10⁶ and “descends” to ~3.5×10⁴ — **10⁶ times** the best model’s 0.032. `analyzeDoubleDescent` still reports `"Possible Double Descent"` because it gates on *relative* ratios only (audit P2/P3).

**Any new polynomial experiment that reuses `fitPolynomial` without a degree cap and an absolute MSE/coefficient-norm guard will teach the same false lesson.** Overfitting (experiment 3) therefore stays in the classical underparameterized regime. Double descent stays the advanced sequel, after Stage 2 of the audit (fix the estimator) lands.

---

## 1. Curriculum role of each lab

Suggested lesson order. Each lab’s control should teach something a static figure cannot.

| Order | Lab | What dragging teaches that a screenshot cannot |
| --- | --- | --- |
| 1 | Linear regression | An outlier *pulls the line*; loss is a sum of squared vertical gaps |
| 2 | Gradient descent | A learning rate that looks “fine” on a round bowl *diverges* on a stretched one |
| 3 | Overfitting | Past a sweet spot, the curve hugs train points and *test error rises* — live |
| 4 | Activation functions | Depth × saturation makes the backprop factor *collapse in real time* |
| 5 | Ridge path (proposed) | One slider trades train fit for a stabler test fit |
| 6 | Bias–variance (proposed) | Many resampled curves *fan out* as degree grows |
| 7 | Logistic boundary (proposed) | Clicked points *move* a decision line; separable data sends weights to infinity |

The existing double-descent module remains the capstone, not a beginner lab.

---

## 2. Experiment 1 — Linear Regression (live OLS)

### 2.1 Learning objective

**A fitted line is the unique intercept and slope that minimize the average squared vertical error, so a point far from the cluster in *x* and *y* moves the line more than a point near the centroid.**

### 2.2 Inputs

Mutable point set, not a one-shot generated split. Generation is only the **initial** configuration and the Reset action.

- Domain: `x ∈ [-1, 1]`, `y ∈ [-2, 2]` (plot window; points may be dragged to the edge but not outside).
- Default `n = 8` points.
- Ground truth (drawn dashed, toggleable):

  \[
  f(x) = 0.8\,x + 0.15
  \]

- Noise model (initialization only):

  \[
  x_i = -1 + \frac{2(i+0.5)}{n},\quad
  y_i = f(x_i) + \sigma\,\varepsilon_i,\quad
  \varepsilon_i \sim \mathcal{N}(0,1)
  \]

  Evenly spaced *x* (not arcsine) so the student can see leverage: endpoints vs interior. Seeded with existing `createRng` + `gaussian`.

- Default `σ = 0.15`, seed `42`.
- Student may: drag a point, click empty space to add (cap `n = 24`), select and delete, or press **Add outlier** which inserts `(0.92, 1.85)` if that slot is free.
- No train/test split. This lab is about the *fit to the points you see*. Overfitting introduces the split.

### 2.3 Controls

| Control | Type | Range | Default | Step | What it teaches |
| --- | --- | --- | --- | --- | --- |
| Point drag | pointer on chart | plot window | — | continuous | Leverage and outliers |
| Add / delete point | click / button | n ∈ [2, 24] | 8 | 1 | n = 2 interpolates (MSE = 0); more points overdetermine |
| Noise σ (regenerate) | range | [0, 0.8] | 0.15 | 0.05 | Same line, wilder cloud |
| Seed | number | integer | 42 | 1 | Reproducibility |
| Show truth | checkbox | — | on | — | Residual vs *signal*, not vs a mystery |
| Show residuals | checkbox | — | on | — | Loss is those vertical segments |
| Intercept | checkbox | — | on | — | Through-origin is a different model |
| Reset | button | — | — | — | Restore defaultConfig |

No Run button. Recompute on every pointer move.

### 2.4 Outputs (every displayed number)

Let the current points be \(\{(x_i,y_i)\}_{i=1}^n\). Model \(\hat y = w x + b\) if intercept is on, else \(\hat y = w x\).

> ### ⚠ **[CORRECTED 2026-08-28] RESIDUAL SIGN — read this before you type any formula from this document.**
>
> **The residual on this site is prediction minus target:**
> \[
> r_i \;=\; \hat y_i - y_i \;=\; w x_i + b - y_i
> \]
> This matches §3.4 of this document and Research B §2.2, and it is the **only** sign under which this document’s own gradient
> \(\partial L/\partial w = \frac{2}{n}\sum_i x_i r_i\) is correct.
>
> This subsection previously defined \(r_i = y_i - \hat y_i\) and labelled it “signed; statistics convention,” contradicting §3.4. **That was wrong and it was dangerous:** substituting the old \(y-\hat y\) sign into the §3.4 gradient flips it, and gradient descent would **ascend** the loss. An engineer copying these two formulas from two sections of the same document would have shipped a lab that runs uphill.
>
> Everything downstream of the residual on this page — \(r_i^2\), SSE, MSE, RMSE, \(R^2\) — is sign-invariant, so no displayed number changes. Only the sign of the *signed* residual readout and the direction of the residual stems change, and both must now read \(\hat y_i - y_i\).

**Fit (intercept on)** — closed form, also the test oracle for `minNormLeastSquares`:

\[
\bar x = \frac1n\sum x_i,\quad
\bar y = \frac1n\sum y_i
\]
\[
S_{xx} = \sum_i (x_i-\bar x)^2,\quad
S_{xy} = \sum_i (x_i-\bar x)(y_i-\bar y)
\]
\[
w = \frac{S_{xy}}{S_{xx}},\quad
b = \bar y - w\bar x
\]

**Fit (intercept off):**

\[
w = \frac{\sum x_i y_i}{\sum x_i^2},\quad b = 0
\]

**Production path:** call existing `minNormLeastSquares(X, y)` with

- intercept on: row \(i\) of \(X\) is \([1,\, x_i]\), recover \(b=\theta_0\), \(w=\theta_1\);
- intercept off: row \(i\) is \([x_i]\).

The closed form is the golden-value check, not a second solver in production.

| Display | Formula |
| --- | --- |
| Slope \(w\) | as above |
| Intercept \(b\) | as above |
| Prediction \(\hat y_i\) | \(w x_i + b\) |
| Residual \(r_i\) | **[CORRECTED]** \(\hat y_i - y_i = w x_i + b - y_i\) (signed; **prediction minus target**, matching §3.4, `metrics.ts` and Research B §2.2). **Not** \(y_i-\hat y_i\) |
| Squared error \(r_i^2\) | — |
| Contribution to MSE | \(r_i^2 / n\) (these **sum to MSE**) |
| SSE | \(\sum r_i^2\) |
| MSE | \(\mathrm{SSE}/n\) — **same definition as** `metrics.ts` |
| RMSE | \(\sqrt{\mathrm{MSE}}\) |
| MAE | \((1/n)\sum |r_i|\) |
| \(R^2\) | \(1 - \mathrm{SSE}/\sum(y_i-\bar y)^2\) (undefined if SST = 0; show “—”) |
| Max \(\lvert r_i\rvert\) | highlight that point |
| Condition of \(X^\top X\) | \(\lambda_{\max}/\lambda_{\min}\) of the 1×1 or 2×2 Gram (for the “all x equal” guard) |

Hover a point: show \((x_i, y_i)\), \(\hat y_i\), \(r_i\), \(r_i^2/n\).

### 2.5 Visualization

1. **Editable scatter + line** (dedicated SVG/canvas, not Recharts — Recharts tooltips fight with drag).
   - X: input \(x\), linear, domain `[-1.05, 1.05]`.
   - Y: target \(y\), linear, domain `[-2.05, 2.05]` **fixed** (do not autoscale; see §2.9).
   - Series: points (train-blue), OLS line (foreground), optional truth (dashed muted), residual stems (vertical segment from \((x_i,y_i)\) to \((x_i,\hat y_i)\)), optional one-point highlight.
2. **Loss breakdown bar** (small): stacked segments of \(r_i^2/n\), same point colors/order. Teaches “MSE is a sum.”
3. No log scale. Residuals can be negative; MSE is already on a friendly scale.

### 2.6 Mathematical model

Ordinary least squares, unique minimizer of \(\frac1n\|X\theta - y\|_2^2\) when \(X\) has full column rank. Equivalent normal equation \((X^\top X)\theta = X^\top y\). With two columns this is the closed form above. **[CORRECTED 2026-08-28]** the engine's ridge is `RIDGE = 1e-8` **times the mean Gram diagonal** (`src/lib/linalg.ts:19, 45-50`), i.e. relative, not the absolute `1e-10` this document previously assumed. It is still negligible for a well-spread 2-column design; leave it on so there is one solver — but see §2.9, because "relative" changes the failure mode.

### 2.7 Expected behavior

| Action | Observation |
| --- | --- |
| Drag a point vertically near \(\bar x\) | Intercept moves; slope barely moves |
| Drag an endpoint far in \(y\) | Slope rotates hard (leverage) |
| Add outlier button | MSE jumps; line tilts; that point’s bar dominates the stack |
| n = 2, distinct x | Line through both points, MSE = 0, \(R^2 = 1\) |
| All x identical (or \(S_{xx} < \varepsilon\)) | **No unique slope.** Show error, freeze last valid line, prompt “spread points in x” |
| All y identical, distinct x | \(w = 0\), \(b = \bar y\), MSE = 0 |
| Toggle intercept off with data not through origin | Line through origin; MSE worse unless the cloud is centered |
| σ = 0 regenerate | Points sit on the dashed truth; recovered \((w,b) \approx (0.8, 0.15)\) |

### 2.8 Educational explanation

**Guiding text:** “This line is not drawn by eye. It is the unique pair (slope, intercept) that makes the average squared vertical gap as small as possible. Drag any point: every number on this page is recomputed from that definition.”

**Aha to engineer:** after the student has a reasonable fit, auto-prompt (one AnalysisPanel note, only when true): “The rightmost point accounts for more than 40% of the MSE. Drag it onto the line and watch MSE collapse.” Trigger predicate: \(\max_i r_i^2 / \mathrm{SSE} > 0.4\).

Second aha: with intercept off, the line misses a cloud that does not pass through the origin — the same OLS criterion, a worse model class.

### 2.9 Numerical hazards and guards

| Hazard | When | Guard |
| --- | --- | --- |
| Singular \(S_{xx}\) | All \(x_i\) equal, or n = 1 | Require n ≥ 2 and \(S_{xx} > 10^{-12}\). Do not call GE. Surface a status, not NaN. |
| SST = 0 | All \(y_i\) equal | \(R^2\) undefined; show “—”, not 0 or 1 |
| Ridge hiding singularity (**fake slope**) | **[CORRECTED 2026-08-28] — stale in form, still valid in substance.** The constant is no longer an absolute `1e-10`; the engine applies `RIDGE = 1e-8` × mean Gram diagonal. The hazard **persists and is not weaker**: because the ridge *scales with* \(\sum x_i^2\), it grows with the data instead of staying negligibly small, so a design whose \(x_i\) differ by \(10^{-16}\) will still be silently regularized into returning *a* confident-looking slope | Unchanged and still correct: **rank check on \(S_{xx}\) *before* calling the solver.** Do not rely on the solver failing |
| Drag outside domain | Pointer leaves SVG | Clamp to plot window |
| Integer seed 0 | Mulberry32 uses `seed >>> 0` | Allowed; document that 0 is a valid seed |

### 2.10 Computational cost

O(n) closed form, n ≤ 24. **Recompute on every pointermove. No debounce, no worker.**

### 2.11 Misleading-visualization risks

- **Autoscaling y** after an outlier makes the line look flatter than it is. **Fixed axes.**
- Plotting residuals as *distance to the line* (perpendicular) would teach the wrong loss. Stems must be **vertical** (the MSE definition).
- Filling the residual triangle or shading to the truth line confuses “error vs fit” with “error vs nature.” Stems go to \(\hat y\), not to \(f(x)\).
- \(R^2\) near 1 with a visibly curved residual pattern would overclaim. If we later add a residual-vs-x plot, keep it; v1 at least does not hide a fan-out behind a single \(R^2\).

---

## 3. Experiment 2 — Gradient Descent

> ### ✅ **[VERIFIED 2026-08-28] This section is fully verified against the real engine. It is the best-specified lab in this document, and its acceptance tests can be shipped verbatim.**
>
> Measured, not asserted:
>
> | Quantity | Predicted here | Measured | Agreement |
> | --- | --- | --- | --- |
> | \(H_{22}\) | exactly 2 | **2.0000** | exact |
> | \(\alpha_{\mathrm{crit}} = 2/\lambda_{\max}\) at \(s=1\), seed 42 | 0.99418 (analytic) | **0.99503** | 0.09% |
> | \(\alpha_{\mathrm{crit}}\) at \(s=10\) | \(\approx 0.02\) | **0.02030** | ✓ |
> | Noiseless OLS \((w,b)\), \(s=1\) | \((0.8,\,0.15)\) | **(0.79510, 0.16319)** | ✓ |
> | Noiseless OLS \((w,b)\), \(s=10\) | \((0.08,\,0.15)\) | **(0.07951, 0.16319)** | ✓, confirms \(w^\star\approx 0.8/s\) |
>
> So the engineered "aha" works **exactly as specified**: with the default \(\alpha=0.2\), dragging feature scale to \(s=10\) drives \(\alpha\) above \(\alpha_{\mathrm{crit}}=0.0203\) and the run diverges.
>
> The caveat flagged in §3.6 — that the default-seed sample has \(\bar x \ne 0\) — is **real but negligible**: \(\bar x = 0.0548\) lifts \(\lambda_{\max}\) from 2 to 2.0117, a **0.6%** effect. Keep printing \(\alpha_{\mathrm{crit}}\) on screen anyway; the point of the selfcheck is to catch a *wrong Hessian factor*, not this.

### 3.1 Learning objective

**Gradient descent on a quadratic loss converges if and only if the step size is below \(2/\lambda_{\max}\) of the Hessian, and a learning rate that works on round contours will diverge once a feature is rescaled.**

### 3.2 Inputs

Fixed dataset during a run (the loss surface must not move under the trajectory).

- n = 20 points, generated once per seed.
- Sampling: existing arcsine `sampleInput` on `[-1, 1]`.
- Then **feature scale** \(s\) (a control): \(x_i \leftarrow s\, x_i\). Default \(s = 1\) keeps x in `[-1, 1]`.
- Target: same linear truth as lab 1, so the OLS solution is known and GD can be judged against it:

  \[
  y_i = 0.8\, x_i^{\mathrm{(unscaled)}} + 0.15 + \sigma\,\varepsilon_i,\quad
  \sigma = 0.1,\quad \varepsilon_i \sim \mathcal{N}(0,1)
  \]

  Use unscaled x in \(f\) so changing \(s\) changes geometry, not the generative slope in original units. After scaling, the OLS slope in *scaled* coordinates is \(w^\star = 0.8 / s\) in the noiseless limit.

  **[VERIFIED 2026-08-28]** — measured on the real engine: noiseless OLS is \((w,b) = (0.79510,\, 0.16319)\) at \(s=1\) and \((0.07951,\, 0.16319)\) at \(s=10\), confirming \(w^\star \approx 0.8/s\). Still lock it with a seed-42 golden test at implementation time; these are the golden values.

- No train/test split. The loss *is* the training MSE on these 20 points. (A “generalization” overlay would confuse the contour.)

### 3.3 Controls

| Control | Type | Range | Default | Step | What it teaches |
| --- | --- | --- | --- | --- | --- |
| Learning rate α | range (log) | \([10^{-3},\, 10^{1}]\) | 0.2 | ×10^{0.05} (log) | The whole point |
| Init \(w_0\) | range | [−2, 2] | −1.2 | 0.05 | Start far from \(\theta^\star\) so the path is visible |
| Init \(b_0\) | range | [−2, 2] | 1.4 | 0.05 | Same |
| Iterations T | range | [1, 400] | 80 | 1 | Too few → not there yet |
| Feature scale \(s\) | range (log) | [0.2, 10] | 1 | ×10^{0.05} | Conditioning / why we standardize |
| Noise σ | range | [0, 0.4] | 0.1 | 0.05 | Bowl center moves; shape barely does |
| Seed | number | integer | 42 | 1 | Reproducible bowl |
| Play / Pause / Step / Reset | buttons | — | — | — | Animation is the static-figure killer |
| Steps per frame | select | 1, 2, 5 | 1 | — | Slow-mo vs skip |

Display (read-only, not knobs): \(\lambda_{\min}\), \(\lambda_{\max}\), \(\kappa=\lambda_{\max}/\lambda_{\min}\), \(\alpha_{\mathrm{crit}}=2/\lambda_{\max}\), \(\alpha_{\mathrm{osc}}=1/\lambda_{\max}\), and a three-state badge **monotonic / oscillating / diverging** from the inequalities in §3.7.

**Out of v1:** momentum. The stability region becomes a 2D (α, β) set whose boundary is easy to get wrong. See §8. **NEEDS VERIFICATION** before shipping momentum.

### 3.4 Outputs

Loss matches `metrics.ts`:

\[
L(w,b) = \frac1n\sum_{i=1}^n (w x_i + b - y_i)^2
\]

Gradient (exact):

\[
\frac{\partial L}{\partial w} = \frac{2}{n}\sum_i x_i\, r_i,\quad
\frac{\partial L}{\partial b} = \frac{2}{n}\sum_i r_i,\quad
r_i = w x_i + b - y_i
\]

Hessian (constant — quadratic loss):

\[
H = \frac{2}{n} X^\top X
= \frac{2}{n}
\begin{bmatrix}
\sum x_i^2 & \sum x_i \\
\sum x_i & n
\end{bmatrix}
\]

Eigenvalues of the 2×2 \([a, c; c, d]\):

\[
\lambda_{\pm}
= \frac{a+d \pm \sqrt{(a-d)^2 + 4c^2}}{2}
\]

with \(a = (2/n)\sum x_i^2\), \(c = (2/n)\sum x_i\), \(d = 2\).

Then \(\alpha_{\mathrm{crit}} = 2/\lambda_{\max}\), \(\alpha_{\mathrm{osc}} = 1/\lambda_{\max}\).

**OLS target** \(\theta^\star = (w^\star, b^\star)\): one call to `minNormLeastSquares` (or the lab-1 closed form). GD does **not** replace OLS; it walks toward it.

Update:

\[
w_{t+1} = w_t - \alpha \partial_w L(w_t,b_t),\quad
b_{t+1} = b_t - \alpha \partial_b L(w_t,b_t)
\]

| Display | Computation |
| --- | --- |
| \(t\) | iteration index |
| \(w_t, b_t\) | state |
| \(L_t\) | MSE at current params |
| \(\|\nabla L\|_2\) | Euclidean norm of the two partials |
| \(\|\theta_t - \theta^\star\|_2\) | distance to OLS |
| \(\lambda_{\min}, \lambda_{\max}, \kappa\) | from H, recomputed when data/s changes |
| \(\alpha_{\mathrm{osc}}, \alpha_{\mathrm{crit}}\) | \(1/\lambda_{\max}\), \(2/\lambda_{\max}\) |
| Status | see §3.7 |
| Final vs OLS | after stop: \(L_T\) vs \(L(\theta^\star)\) |

If any of \(w, b, L\) is non-finite or \(L > L_{\max}\) with \(L_{\max} = 10^6\), **halt**, mark `diverged: true`, keep the last finite point.

### 3.5 Visualization

1. **Loss surface + trajectory** (canvas heatmap + SVG polyline; Recharts has no contour primitive).
   - Axes: \(w\) horizontal, \(b\) vertical, linear, domain `[-2.5, 2.5]` both (matches init ranges with margin).
   - Heatmap: evaluate \(L\) on a `G × G` grid, `G = 80`. Color linear in \(L\), clipped at the 95th percentile of the *grid* (not the trajectory) so a diverging path cannot wash out the bowl. Optional log-color toggle, default **off**.
   - Overlay: contour is optional in v1 (heatmap suffices). Mark \(\theta^\star\) as a cross, start as a circle, path as a polyline with a moving head.
   - If the next step would leave the box, draw an arrow on the boundary and stop (do not silently clip \(\theta\) — that would fake convergence).
2. **Loss vs iteration**
   - X: \(t = 0..T\), linear.
   - Y: \(L_t\), **log toggle default ON** (ErrorChart pattern, `clampForLog` at `1e-12`). Divergence is obvious on log; monotonic crawl is obvious too.
3. **Parameter traces** (small): \(w_t\) and \(b_t\) vs \(t\), linear y. Oscillation is a sign flip here.

Play uses `requestAnimationFrame`, advancing `stepsPerFrame` GD steps, pushing points onto the trajectory. Recomputing the heatmap only when `seed`, `σ`, or `s` changes.

### 3.6 Mathematical model

Full-batch gradient descent on a convex quadratic. Closed-form error recurrence:

\[
\theta_{t+1} - \theta^\star = (I - \alpha H)(\theta_t - \theta^\star)
\]

Spectral radius \(\rho(I-\alpha H) < 1\) iff \(0 < \alpha < 2/\lambda_{\max}(H)\). This is exact, not heuristic.

**Approximate numeric for the default (s = 1, arcsine x, \(\mathbb{E}[x]\approx 0\), \(\mathbb{E}[x^2]=1/2\)):**

\[
a \approx 1,\quad c \approx 0,\quad d = 2
\implies \lambda_{\max} \approx 2,\quad \lambda_{\min} \approx 1,\quad
\alpha_{\mathrm{crit}} \approx 1,\quad \alpha_{\mathrm{osc}} \approx 0.5
\]

Default α = 0.2 should converge monotonically. The UI must still **compute** α_crit from the sample Hessian, never hardcode 1.

When \(s\) grows, \(\sum x_i^2 \sim s^2 n/2\), so \(a \sim s^2\), \(\lambda_{\max} \sim \max(s^2, 2)\), \(\alpha_{\mathrm{crit}} \sim 2/s^2\) for \(s \gtrsim \sqrt{2}\). At \(s = 10\), expect \(\alpha_{\mathrm{crit}} \approx 0.02\). The default α = 0.2 then **diverges**. That is the engineered aha.

**[VERIFIED 2026-08-28]** — the default-seed sample does have \(\bar x \neq 0\): \(\bar x = 0.0548\), which lifts \(\lambda_{\max}\) from 2 to **2.0117**, a **0.6%** effect. Measured \(\alpha_{\mathrm{crit}} = 0.99503\) at seed 42, \(s=1\) (analytic 0.99418; 0.09% agreement), and \(0.02030\) at \(s=10\). Implementers must still print α_crit on screen and ship the selfcheck `α_crit ∈ (0.7, 1.3)` at seed 42, s = 1 — its job is to catch a wrong Hessian factor (a value of 0.01 or 50), not this 0.6%.

### 3.7 Expected behavior

| α relative to data | Status badge | Path |
| --- | --- | --- |
| \(0 < \alpha < 1/\lambda_{\max}\) | Monotonic | Smooth crawl to \(\theta^\star\) |
| \(1/\lambda_{\max} < \alpha < 2/\lambda_{\max}\) | Oscillating | Zigzag, still converges; loss log-plot sawtooth decaying |
| \(\alpha > 2/\lambda_{\max}\) | Diverging | \(L_t\) grows; halt at \(L_{\max}\) |
| \(\alpha \le 0\) | Invalid | Reject in validate (α slider starts at 1e-3) |
| s = 1, α = 0.2, T = 80 | Converged close to OLS | \(\|\theta_T-\theta^\star\|\) small |
| s = 10, α = 0.2 | Diverges | Same α, new geometry |
| s = 10, α = 0.01 | Converges, slowly | Thin valley: many steps along \(b\) |
| T too small | Not yet | Honest “still moving” if \(\|\nabla L\| > 10^{-3}\) |

**Exact divergence threshold:** \(\alpha_{\mathrm{crit}} = 2/\lambda_{\max}(H)\) for **this** dataset, this \(s\), this MSE definition (the factor 2 in \(H\) comes from differentiating \(\frac1n\sum r^2\), not \(\frac1{2n}\sum r^2\)). If a future change switches to the \(\frac12\) convention, α_crit doubles — tests must use the same \(L\).

### 3.8 Educational explanation

**Guiding text:** “Each step subtracts α times the gradient of the same MSE you already met. The bowl’s steepest curvature \(\lambda_{\max}\) forbids α above \(2/\lambda_{\max}\). We compute that number from your data and draw it. Cross it.”

**Aha:** lock α at 0.2, drag **feature scale** from 1 to 10, press Play. The path that settled now flies off the heatmap. Caption: “Nothing changed about the algorithm. You stretched a feature. This is why people normalize inputs.”

Second aha: park α just below α_crit vs just above, on log-loss. Convergence vs explosion is a cliff, not a vibe.

### 3.9 Numerical hazards and guards

| Hazard | Guard |
| --- | --- |
| Divergence overflow | Halt if non-finite or \(L > 10^6\); do not paint Inf into Recharts |
| α_crit mis-derived (missing factor 2) | Selfcheck: noiseless, centered x, \(H_{22}\) must equal **2**, not 1 |
| Heatmap washed out by a diverged \(L_t\) | Color scale from grid percentiles, independent of trajectory |
| Tiny λ_min when n=2 and collinear x | Unlikely with n=20 arcsine; still if \(\lambda_{\min} < 10^{-12}\) refuse and ask for a new seed |
| Animation vs React | Trajectory array is the state; do not refit OLS every frame |
| Main-thread jank | T=400, n=20 is cheap. Heatmap 80² × n = 1.28×10⁵ ops, once per data change. **No worker required.** If G=200 or n=500 later, worker the grid. |

### 3.10 Computational cost

Trajectory: O(T n) per Play, live. Heatmap: O(G² n) on data change only. **No debounce on α** (it only affects the next Play). Debounce heatmap rebuilds on `s` / σ sliders (~50 ms) so dragging s stays smooth.

### 3.11 Misleading-visualization risks

- **Log color on the heatmap** makes the basin look wider than it is. Default linear; if log is on, label “log L”.
- **Autoscale of (w,b) axes** to the trajectory makes divergence look like a short trip to the frame edge. Fixed domain; overflow = arrow + halt.
- Plotting the *update* in (x, y) data space instead of (w, b) parameter space would show a line flapping, which is fine as a *second* view but must not replace the contour — students would not see α_crit.
- A 3D surface that rotates hides the path. Stay 2D.
- Saying “learning rate 0.2 is always safe” after the s=1 demo — the s slider exists to kill that myth. The analysis note must mention α_crit **and** s.

---

## 4. Experiment 3 — Overfitting (live complexity)

### 4.1 Learning objective

**Once the model is already flexible enough to represent the truth, extra degrees of freedom keep driving training error down while test error rises — that rise is overfitting, and it is visible before any interpolation-threshold or double-descent story.**

This lab is **not** a second double-descent sweep. It is the classical U-curve with a live degree slider. The shipped DD module remains the “what if you keep going” sequel, after its estimator is fixed.

### 4.2 Inputs

Reuse `buildDataset` plumbing (Mulberry32, Gaussian noise, 80/20 split, `createRng(seed+10_000)` for the shuffle) but **change the ground truth** so “the right degree” is a fact, not a taste.

\[
f(x) = 0.2\, T_1(x) + 0.7\, T_3(x) = 2.8 x^3 - 1.9 x
\]

Chebyshev \(T_1=x\), \(T_3=4x^3-3x\). Exact noiseless recovery at degree 3 must yield coefficients \(\approx [0,\, 0.2,\, 0,\, 0.7]\) in the existing basis (`selfcheck` already proves degree-1 recovery of `[2, 3]`).

- x: existing arcsine sampling on `[-1, 1]` (keep pairing with Chebyshev).
- \(y_i = f(x_i) + \sigma \varepsilon_i\), \(\varepsilon_i \sim \mathcal{N}(0,1)\).
- Defaults: `datasetSize = 50`, `trainRatio = 0.8` (n_train = 40, n_test = 10), `σ = 0.25`, seed `42`.
- **Hard cap:** `maxDegree = 12` so `p = 13 ≪ n_train = 40`. This stays far from the known high-degree blow-up (audit P3, which appeared near degree ~n).

> ### **[CORRECTED 2026-08-28] The U-curve is real. The claim "the best degree is 3, the true degree" is NOT, and must never appear in copy.**
>
> Measured at exactly these defaults (cubic truth, seed 42, \(n=50\), \(\sigma=0.25\), \(n_{\text{train}}=40\), \(n_{\text{test}}=10\)):
>
> - **The argmin is degree 4, not 3.**
> - Degrees 3 / 4 / 5 form a **plateau within 4.5%**: test MSE **0.0430 / 0.0412 / 0.0425**. With only **10 test points** those three are statistically indistinguishable.
> - The U-shape itself is real and pedagogically excellent: train MSE falls **monotonically 0.261 → 0.034** while test MSE rises to **0.206** — a **4.8×** rise.
>
> **Hard UI constraint:** no copy, caption, analysis note or summary card may say *"the best degree is 3, which is the true degree."* **The data does not support it.** Copy must report a **plateau**: something of the form "degrees 3–5 are tied within a few percent on only 10 test points — the data cannot single one out." This is the same honesty rule §4.11 already states; it is now a measured requirement, not a precaution.
>
> **[CORRECTED 2026-08-28] Seed fragility — newly discovered, and it changes the control design.** Measured argmin across seeds \(\{1, 7, 42, 99, 2024\}\) = \(\{7, 3, 4, 4, 3\}\).
>
> - **At seed 1 the lab breaks entirely.** The argmin is **7**, and test(12) = **0.068** vs test(3) = **0.060** — there is **no visible overfitting at all**.
> - Seed is a **student-facing control**, so a student *will* reach seed 1. The analysis notes must therefore be able to emit *"this sample does not show a clean sweet spot"* and the lab must not fake a U when there isn't one. This is a required predicate, not a nice-to-have.
> - **Seed 42 remains a defensible default.**
> - **The left arm is non-monotone:** test(2) = **0.330** > test(1) = **0.253**. This is not noise and not a bug — the truth is an **odd** function, so a degree-2 term can only fit noise. It needs a caption saying so, or a student will read the bump as a broken chart.
> - **Confirmed:** at \(\sigma = 0\), degree 3 recovers coefficients \([0,\, 0.2,\, 0,\, 0.7]\) **exactly**.

The original `NEEDS VERIFICATION` on this point is closed by the measurements above: the U-shape holds at the default seed, so there is no need to change σ or n. The instruction it carried still stands — if a future defaults change breaks the U-shape, fix σ or n, **never** by stretching the degree into the unstable regime.

Optional second truth in an advanced dropdown: `sin(2πx)` (the DD lab’s \(f\)), labeled “harder target (no finite polynomial is exact).” Default remains the cubic.

### 4.3 Controls

| Control | Type | Range | Default | Step | What it teaches |
| --- | --- | --- | --- | --- | --- |
| Degree d | range | [0, 12] | 3 | 1 | The live complexity axis |
| Noise σ | range | [0, 0.8] | 0.25 | 0.05 | More noise → earlier test-error rise |
| Dataset size | select | 30, 50, 80 | 50 | — | More data → U-curve shifts right |
| Seed | number | integer | 42 | 1 | Unlucky splits exist; be honest |
| Show truth | checkbox | on | — | — | Wiggles vs \(f\) |
| Ridge λ | range (log) | **see the blocking note below** | **see below** | ×10^{0.1} | Preview of lab 5; default ≈ current solver |
| Regenerate | button | — | — | — | New sample, same settings |

> ### ⚠ **[CORRECTED 2026-08-28] The λ slider spec is BLOCKED on a decision that must be made before anyone writes it.**
>
> Two facts, both re-checked against the engine:
>
> 1. **`minNormLeastSquares(X, y)` still takes no λ argument.** The API change this document requires is **real and still open**. Nothing has been implemented.
> 2. **The engine's λ is now *relative*.** It applies \(\lambda_{\text{applied}} = \texttt{RIDGE}\cdot\overline{\mathrm{diag}}(\mathbf{G})\) with `RIDGE = 1e-8` (`src/lib/linalg.ts:19, 45-50`). So a student-facing slider over **absolute** values \([10^{-10}, 10^{2}]\) would display a λ that differs from the λ actually applied **by the mean Gram diagonal** — measured **≈ 41 at \(p=41\)** and **≈ 2.3 at \(p=161\)**. The discrepancy is not a constant; it moves as the student drags degree.
>
> **Whether the student-facing λ is absolute or relative must be decided and documented before the slider is built.** Shipping the range in the table above without that decision would put a number on screen that is off by a factor that changes under another control — the definition of a dishonest instrument. See Research B §2.2 for the three-way λ ambiguity this belongs to.

Degree and λ are **live**. Dataset knobs regenerate points (cheap) then refit. No full Run sweep required; optionally precompute the 13-point error curve whenever data/λ changes so the U-chart is instant.

### 4.4 Outputs

Reuse `fitPolynomial` / `predict` / `meanSquaredError` / `generalizationGap`. For the λ slider, pass λ into the solver instead of the global `RIDGE` constant — **the engine must accept λ as an argument** (today it is a module const). That is a small, shared API change, not a new algorithm. **[VERIFIED 2026-08-28]** — still true: `minNormLeastSquares(X, y)` takes no λ. And the new argument must carry an explicit absolute-vs-relative contract; see the blocking note in §4.3.

| Display | Computation |
| --- | --- |
| d, p = d+1 | — |
| Train MSE, Test MSE | `metrics.ts` on the two splits |
| Gap | test − train |
| \(\|\theta\|_2\) | existing `vectorNorm` |
| Train/test \(R^2\) | \(1 - \mathrm{MSE}/\mathrm{Var}(y_{\mathrm{split}})\) with population Var = \(\frac1n\sum(y-\bar y)^2\) |
| Best d on the precomputed grid | \(\arg\min_d\) test MSE, for the summary card |
| Status | `underfit` if d < 3 and both errors high; `sweet spot` if d is the min-test degree; `overfit` if train MSE < 0.8 × test MSE **and** d > argmin_test; else `unclear`. **[CORRECTED 2026-08-28]** add a `plateau` state: when several degrees are within ~10% of min test MSE (which is the case at the defaults — 3/4/5 within 4.5%), the UI must say so rather than crown one degree. And `unclear` must be reachable and honest — at seed 1 there is no sweet spot at all |

Do **not** run `analyzeDoubleDescent` here. Do not mention interpolation unless the student opts into the sine target *and* raises a future cap — which v1 must not allow.

### 4.5 Visualization

Reuse, do not fork:

1. **ModelExplorer-style composed chart** — train scatter, test scatter, fitted curve on 201 x-grid, dashed truth curve. X linear `[-1.05,1.05]`. Y linear, domain from data percentiles with padding, **but clamp predictions** (see hazards).
2. **ErrorChart-style U-curve** — x = degree 0..12, y = MSE, log toggle default **off** (values should stay O(1); log is how the DD bug was made to look like a second descent). Vertical `ReferenceLine` at the selected d. Click-to-select already exists — keep it, **and** bind the degree slider so keyboard users can reach the explorer (audit S4).
3. Summary stats row (existing `Stat` / `Item` primitive).

Colors: train blue, test red, truth muted/green token (add `--truth` if missing), fit foreground.

### 4.6 Mathematical model

Same as production today:

\[
\phi_k(x)=T_k(x),\quad
\hat y(x)=\sum_{k=0}^{d}\theta_k T_k(x),\quad
\theta = \arg\min_\theta \|X\theta-y_{\mathrm{train}}\|_2^2 + \lambda\|\theta\|_2^2
\]

Primal solve (`p ≤ n` always, given the cap): \(\theta = (X^\top X + \lambda I)^{-1} X^\top y\).

### 4.7 Expected behavior

| Setting | Observation |
| --- | --- |
| d = 0 | Horizontal line at train mean; both errors high |
| d = 1 | Odd linear-ish; still underfits a cubic |
| d = 3, σ = 0 | Train and test MSE ~ 0; θ ≈ `[0, 0.2, 0, 0.7]` |
| d = 3, σ = 0.25 | **[CORRECTED]** Near the floor, but **on a plateau**: measured test MSE 0.0430 (d=3) / 0.0412 (d=4) / 0.0425 (d=5) — argmin is d=4 and the three are within 4.5% on 10 test points. Do not label d=3 "the sweet spot because it is the true degree" |
| d = 2 | **[CORRECTED]** Test MSE 0.330, **worse than d=1** (0.253). Not a bug: the truth is odd, so a degree-2 term can only fit noise. This bump needs a caption |
| d = 10–12 | Fit wiggles through train points; train MSE down; test MSE up |
| σ → 0 | Overfit gap shrinks (less noise to memorize) but high-d still interpolates idiosyncrasy of the sample x’s |
| σ → 0.8 | Sweet spot may move left; U-curve noisier because n_test = 10 |
| λ ↑ at d = 12 | Wiggles shrink; test MSE can improve — bridge to Ridge |

Failure cases to **show honestly**: n_test = 10 makes the U-curve jagged. Analysis notes must say “test curve is noisy with only N test points,” not invent a unique sweet spot if several degrees are within 10% of min test MSE.

### 4.8 Educational explanation

**Guiding text:** “The true function is a cubic. A degree-3 Chebyshev model can represent it exactly. Drag degree past 3: training error will keep dropping. Test error will not. That split is overfitting.”

**Aha:** start at 3, drag to 12 with truth overlay on. The black fit peels off the dashed cubic and chases blue points. Simultaneously the red test MSE ticks up. One sentence in AnalysisPanel when `test(d) > 1.3 * test(3)` and `train(d) < train(3)`: “Training looks better. Testing looks worse. The extra degrees are fitting noise.”

### 4.9 Numerical hazards and guards

| Hazard | Guard |
| --- | --- |
| **The DD blow-up, cloned** | Hard cap d ≤ 12. Reject UI values above. Never stride into p ≈ n. |
| Non-finite θ or MSE | If `!Number.isFinite` on any coefficient or metric: drop that degree from the curve, badge `numerical failure`, do not connect a line through 1e6 |
| Coefficient explosion | If \(\|\theta\|_2 > 10^4\), treat as failure even if MSE looks OK (cancellation) |
| Prediction spikes between sample x | 201-point curve can still overshoot. Y-axis: clip plotted \(\hat y\) to `[-4, 4]` for drawing only; tooltip shows raw; if raw exceeds clip, caption “curve clipped for display” |
| λ = 0 vs the engine's ridge | **[CORRECTED 2026-08-28]** Expose λ, but the "match the current solver" default is **not** `1e-10` — the engine applies `1e-8` × mean Gram diagonal. Pick the default only after the absolute-vs-relative decision in §4.3. λ = 0 remains allowed at d ≤ 12 |
| Tiny test set | Caption n_train / n_test. If n_test < 8, warn |
| Log-y on this chart | Allowed as a toggle, default off. Tooltip always raw (ErrorChart pattern) so a spike cannot hide |

### 4.10 Computational cost

One fit: p ≤ 13, n = 40, O(n p² + p³) ≈ thousands of ops. Thirteen fits on data change: still **live, no debounce required, no worker.** Pointer-drag on degree is one extra fit (or a lookup in the cached 13).

### 4.11 Misleading-visualization risks

- **Log y** on a U-curve that goes 0.04 → 0.12 looks dramatic on linear and boring on log — or the reverse. Default linear.
- Autoscale y on the fit chart lets a single spike flatten the cubic visually (same class of lie as the DD log axis). Clip + caption.
- Calling the min-test degree “the true degree” when several are tied. Report a plateau.
- Tiny test set: a U that is actually sampling noise. Always print n_test.
- Leaving the DD verdict widget on this page would tell beginners they witnessed double descent. **Do not reuse `ExperimentSummary`’s DD field.**

---

## 5. Experiment 4 — Activation Functions

### 5.1 Learning objective

**Saturating activations crush their derivative, so a chain of them drives the backpropagated gradient to zero with depth — unless the operating point and the activation keep \(\lvert \varphi'(z)\rvert\) away from zero.**

### 5.2 Inputs

No dataset is required for panels A–B. Panel C (dead ReLU) uses a 1-D point cloud:

- n = 40, \(x_i\) even in `[-2, 2]`, no y (unsupervised operating-point demo).
- Optional noise is not used; x is deterministic given n.

### 5.3 Controls

**Panel A — shape**

| Control | Type | Range | Default | Step | Teaches |
| --- | --- | --- | --- | --- | --- |
| Activation | select | list in §5.6 | sigmoid | — | Family differences |
| Input window | range | width 4–16, center [−8, 8] | [−6, 6] | 0.5 | Saturation lives in the tails |
| Leaky/ELU α | range | [0.01, 0.5] | 0.01 (leaky) / 1.0 (ELU) | 0.01 | Only relevant for those two |

**Panel B — chain (vanishing)**

| Control | Type | Range | Default | Step | Teaches |
| --- | --- | --- | --- | --- | --- |
| Depth L | range | [1, 32] | 8 | 1 | Product of derivatives |
| Weight w | range | [−2, 2] | 1 | 0.05 | \(\varphi' w\) per layer |
| Bias b | range | [−2, 2] | 0 | 0.05 | Moves the operating point |
| Input a₀ | range | [−3, 3] | 0 | 0.05 | Where the chain starts |

**Panel C — dead ReLU**

| Control | Type | Range | Default | Step | Teaches |
| --- | --- | --- | --- | --- | --- |
| Neuron w, b | two ranges | w ∈ [−2, 2], b ∈ [−2, 2] | w = 1, b = −1.2 | 0.05 | When z_i = w x_i + b ≤ 0 for all i |
| Activation | ReLU vs leaky | — | ReLU | — | Leaky never fully dies |

### 5.4 Outputs

**Panel A.** For a 401-point grid on the window, plot \(\varphi(z)\) and \(\varphi'(z)\). Readouts at a hairline z₀ (drag on the plot):

| Number | Formula |
| --- | --- |
| z₀ | hairline |
| φ(z₀), φ'(z₀) | §5.6 |
| Saturation? | \(\lvert\varphi'(z_0)\rvert < 0.01\) → “saturated” |

Annotated z where \(\lvert\varphi'\rvert = 0.01\) (closed form for sigmoid/tanh; numerical scan otherwise).

**Panel B.** Exact 1-unit chain (not a slogan):

\[
a_{\ell} = \varphi(w\, a_{\ell-1} + b),\quad \ell = 1,\ldots,L
\]
\[
\delta_0 = 1,\quad
\delta_{\ell} = \varphi'(w\, a_{\ell-1} + b)\, w\, \delta_{\ell-1}
\]

Display \(a_L\) and \(\delta_L = \partial a_L / \partial a_0\). Also display the per-layer table \(\lvert\varphi'(z_\ell) w\rvert\).

**Panel C.** \(z_i = w x_i + b\), \(a_i = \varphi(z_i)\). Dead fraction \(= \frac1n \#\{i : z_i \le 0\}\). If ReLU and dead fraction = 1: “Gradient w.r.t. (w, b) is exactly 0 on this batch. GD cannot revive this unit.” That statement is exact for ReLU: the subgradient is \(\{0\}\) on the open half-space \(z<0\), and **this site's convention is \(\varphi'(0)=0\)**.

**[CORRECTED 2026-08-28]** The former claim that this "matches PyTorch," and the `NEEDS VERIFICATION` asking someone to confirm it, are both **deleted**. That claim cannot be verified in this repo (there is no PyTorch here), and it buys nothing pedagogically. State **our own convention** — \(\varphi'(0)=0\) for ReLU — label it as a convention, and move on. A student does not need an appeal to another framework's authority to understand that a derivative at a kink is a choice.

### 5.5 Visualization

1. **φ and φ' as two charts stacked** (never one axis — see §5.11). X linear = z. Y linear, independently auto for each (sigmoid ∈ (0,1), ReLU unbounded). 401 samples. Recharts `Line` is fine (`isAnimationActive={false}`).
2. **|δ_ℓ| vs depth**, **log y required** (ErrorChart clamp `1e-12`). Linear y would look like a flat zero after a few sigmoids.
3. **Chain activations** a_ℓ vs ℓ (linear) so students see the forward map saturate even when they only came for the gradient.
4. **Dead ReLU:** 1-D scatter of x colored by active/dead, plus the threshold x = −b/w when w ≠ 0.

No batch Run. All live.

### 5.6 Mathematical model (precise φ and φ')

Use **stable** primitives. Naive `Math.exp` is part of the hazard list.

**Stable sigmoid**

\[
\sigma(z)=
\begin{cases}
\dfrac{1}{1+e^{-z}} & z \ge 0 \\[6pt]
\dfrac{e^{z}}{1+e^{z}} & z < 0
\end{cases}
\qquad
\sigma'(z)=\sigma(z)\,(1-\sigma(z))
\]

Max \(\sigma' = 1/4\) at 0. \(\sigma'(z)=0.01\) at \(z = \pm \log(99) \approx \pm 4.595\).

**Tanh:** `Math.tanh` (stable). \(\tanh'(z)=1-\tanh^2(z)\). Max 1 at 0. \(\tanh'(z)=0.01\) at \(z = \pm \mathrm{artanh}(0.994987...) \approx \pm 2.993\).

**ReLU:** \(\varphi(z)=\max(0,z)\). \(\varphi'(z)=1_{z>0}\), **\(\varphi'(0)=0\)** — **[CORRECTED 2026-08-28]** this is **this site's stated convention**, chosen so that the dead-unit demo in Panel C is exactly true. The former "(PyTorch convention)" attribution is deleted: unverifiable here, and unnecessary.

**Leaky ReLU:** \(\varphi(z)=\max(\alpha z, z)\). \(\varphi'(z)=\alpha\) for \(z<0\), \(1\) for \(z>0\), and **this site's convention is \(\varphi'(0)=1\)** so a unit sitting exactly at 0 is not treated as dead. **[CORRECTED 2026-08-28]** — the former "matches PyTorch" claim and its `NEEDS VERIFICATION` are deleted for the same reason. Label \(\varphi'(0)\) as *our* convention in the UI, at both kinks, and never claim parity with a framework this repo does not contain.

**ELU:** \(\varphi(z)=z\) if \(z>0\) else \(\alpha(e^{z}-1)\). \(\varphi'(z)=1\) if \(z>0\) else \(\alpha e^{z}\). Default α = 1. Use `Math.expm1` for φ.

**Softplus:** \(\varphi(z)=\log(1+e^{z})\). Stable:

\[
\varphi(z)=
\begin{cases}
z + \log1p(e^{-z}) & z > 0 \\
\log1p(e^{z}) & z \le 0
\end{cases}
\qquad
\varphi'(z)=\sigma(z)
\]

**SiLU / Swish:** \(\varphi(z)=z\,\sigma(z)\).

\[
\varphi'(z)=\sigma(z)+z\,\sigma(z)\,(1-\sigma(z))=\sigma(z)\bigl(1+z(1-\sigma(z))\bigr)
\]

**GELU (exact):** \(\varphi(z)=z\,\Phi(z)=\frac12 z\bigl(1+\mathrm{erf}(z/\sqrt{2})\bigr)\).

\[
\varphi'(z)=\Phi(z)+z\,\phi(z),\quad
\phi(z)=\frac{1}{\sqrt{2\pi}}e^{-z^2/2}
\]

**[CORRECTED 2026-08-28] There is no `Math.erf`.** `erf` is **not part of ECMAScript** and is not implemented by any JavaScript engine. The "if missing, fall back" framing above was wrong: there is nothing to fall back *from*. The choice is binary and must be made up front:

- **implement `erf` yourself** (e.g. Abramowitz–Stegun 7.1.26 or a rational/continued-fraction approximation, with its accuracy stated), **or**
- **use the tanh approximation** \(\mathrm{GELU}(z)\approx \frac12 z\bigl(1+\tanh[\sqrt{2/\pi}(z+0.044715 z^3)]\bigr)\) and **label it as an approximation in the UI.**

Either way, do not silently mix an exact φ with an approximate φ′. There is no fallback question here, only an implementation decision.

**Identity** (control): φ = z, φ' = 1. The chain then has \(\delta_L = w^L\). Teaches exploding (|w|>1) vs vanishing (|w|<1) *without* saturation.

v1 set: identity, sigmoid, tanh, ReLU, leaky ReLU, ELU, softplus, SiLU. GELU only if erf (or the labeled approximation) is decided.

**Softmax temperature (small extra, same lab):** two logits \((z, 0)\), temperature τ > 0:

\[
p = \frac{e^{z/\tau}}{e^{z/\tau}+1}=\sigma(z/\tau)
\]

Stable: compute in terms of `σ`. Slider τ ∈ [0.1, 5]. Shows sharpening. Guard: τ ≥ 0.1 so we do not hit overflow in `z/τ` for large z; still use stable σ.

### 5.7 Expected behavior

| Setup | Observation |
| --- | --- |
| Sigmoid, z hairline at 0 | φ=0.5, φ'=0.25 |
| Sigmoid, \|z\| > 4.6 | “saturated”, φ' < 0.01 |
| Sigmoid chain, w=1, b=0, a₀=0, L=10 | \(\delta_L\) extremely small (order 10^{-6} or less; exact value from the recurrence, not 0.25^{10}, because a_ℓ moves) |
| Identity chain, w=1 | \(\delta_L=1\) for all L |
| Identity chain, w=1.2, L=32 | exploding \(\delta_L\) |
| ReLU, b = −3, w = 1, x ∈ [−2,2] | all z < 0, dead fraction 1 |
| Leaky ReLU, same | dead fraction 0; small negative leak |
| Compare sigmoid vs ReLU φ' plot | ReLU' is 0 or 1; no vanishing *in the active region* |

**Do not claim** \(\delta_L = (1/4)^L\) for sigmoid unless w=1 **and** every pre-activation is 0 (which the chain with b=0, a₀=0 does *not* maintain). The live recurrence is the truth; a footnote may show the textbook bound \(\lvert\delta_L\rvert \le (|w|/4)^L\) for sigmoid.

**NEEDS VERIFICATION:** the footnote bound \(\lvert\sigma'\rvert\le 1/4\) is correct; the product bound requires also bounding |w|. Keep the inequality labeled as a bound, not the measured \(\delta_L\).

### 5.8 Educational explanation

**Guiding text:** “Training a deep net multiplies one φ'(z) per layer (and a weight). If each factor is 0.25, ten layers leave almost nothing. Drag depth with sigmoid, then switch to ReLU or identity.”

**Aha:** L = 16, sigmoid, default w, b, a₀ — log-plot of |δ| is a cliff. Flip activation to ReLU: the cliff disappears *unless* panel C shows the unit is dead. Two failure modes, both visible, neither requires training a net.

### 5.9 Numerical hazards and guards

| Hazard | Guard |
| --- | --- |
| `exp(z)` overflow (\|z| ≳ 700) | Stable σ, stable softplus, `expm1` for ELU; never `1/(1+Math.exp(-z))` alone |
| GELU without erf | See §5.6 |
| Log plot of \(\delta_L=0\) (ReLU dead at layer 1) | clampForLog; caption “exactly 0” in tooltip if raw is 0 |
| Chain overflow (identity, \|w|>1, L=32) | Halt recurrence if non-finite; show “exploded” |
| Division in dead-ReLU threshold −b/w | If \|w\| < 1e-12, treat as “no crossing” (all dead or all alive from sign of b) |

### 5.10 Computational cost

O(grid) ~ 400, O(L) ~ 32. **Live, no debounce, no worker.**

### 5.11 Misleading-visualization risks

- **φ and φ' on one y-axis:** sigmoid' ≤ 0.25 looks like “flat zero” next to sigmoid ∈ (0,1). **Two charts.**
- Linear y for |δ_ℓ| hides vanishing. **Log y.**
- Teaching “ReLU has no vanishing gradient” without panel C (dead units). Always ship C on the same page.
- Calling the chain “a deep net” — it is a 1-wide MLP. Caption it as a **minimal model of the product of derivatives**, not ImageNet.
- Softmax with unshifted `exp(z/τ)` for large z. Always stable σ.

---

## 6. Proposed experiment 5 — Ridge regularization path

### 6.1 Learning objective

**A single penalty λ shrinks coefficients and can lower test error for an overflexible model, by giving up some training fit.**

### 6.2 Inputs

Same cubic + noise dataset as overfitting (§4.2). Freeze degree at **10** (overflexible on purpose). n = 50, 80/20, σ = 0.25, seed 42.

### 6.3 Controls

| Control | Type | Range | Default | Step | Teaches |
| --- | --- | --- | --- | --- | --- |
| λ | range **log** | [10^{-6}, 10^{3}] | 1 | ×10^{0.05} | The path |
| Degree | range | [3, 12] | 10 | 1 | λ interacts with d |
| σ, n, seed | same as §4 | — | — | — | — |

Live on λ (one primal solve).

### 6.4 Outputs

θ(λ), \(\|\theta\|_2\), train/test MSE, effective df **NEEDS VERIFICATION** of the displayed formula:

\[
\mathrm{df}(\lambda)=\mathrm{tr}\bigl(X(X^\top X+\lambda I)^{-1}X^\top\bigr)
\]

For p = 11 this is a 11×11 inverse — fine. If the trace formula is skipped in v1, do not show a fake “degrees of freedom.”

### 6.5 Visualization

1. **Coefficient paths:** x = log₁₀ λ (descending λ left-to-right is the usual glmnet convention — pick one, label it). Y = θ_k, one line per k. Linear y.
2. **Train vs test MSE vs log λ.** Linear y default. Marker at the λ that minimizes test MSE.
3. ModelExplorer overlay at the current λ (reuse).

### 6.6 Model

\[
\theta(\lambda)=(X^\top X+\lambda I)^{-1}X^\top y_{\mathrm{train}}
\]

Same primal path as `linalg.ts` with **variable** λ. Do not use the dual path (p < n here).

### 6.7 Expected behavior

Large λ: θ → 0, both errors → error of the zero model. Small λ: recovers the unregularized overfit. Intermediate λ: test MSE dip. No dip is possible on a bad split — then say so (honest notes).

### 6.8 Explanation / aha

Drag λ while watching the wiggly degree-10 curve *relax* toward the cubic. Test MSE falls then rises. “The lever is λ, not a smaller degree.”

### 6.9 Hazards

λ too small + d = 12: still OK given the cap. λ = 0: skip adding ridge; if XᵀX is ill-conditioned, fall back to current GE/Jacobi. **Do not** reuse `analyzeDoubleDescent`. log λ = 0 is λ = 1, not “off.”

### 6.10 Cost

One 11×11 solve per slider tick. **Live, no worker.** Optional precompute 40 λ-grid points for the path chart.

### 6.11 Misleading risks

Path plots with λ increasing left-to-right vs glmnet’s reverse — label the axis. Shrinkage toward **0 in Chebyshev coordinates**, not toward the true [0, 0.2, 0, 0.7]; an advanced note can say “ridge does not know the true cubic.” Plotting raw λ on a linear x-axis crams the interesting region. **Log x required.**

---

## 7. Proposed experiment 6 — Bias–variance (resampling)

### 7.1 Learning objective

**Test error of a fitted model is (in expectation) noise + bias² + variance; dragging degree makes the bias fall and the variance *visible as a fan of curves*.**

### 7.2 Inputs

Same generative model as §4.2. Draw **M independent datasets** of size n_train (no test split per copy — evaluate on a fixed dense x-grid against *noiseless* f, plus a known σ²).

Defaults: M = 20, n = 30, degrees `{0,1,2,3,5,8,12}`, σ = 0.25, seed 42. Each dataset uses `createRng(seed + m * 1_000_003)`.

### 7.3 Controls

| Control | Type | Range | Default | Step | Teaches |
| --- | --- | --- | --- | --- | --- |
| Degree d | range (subset above) | 0–12 | 3 | — | Fan-out |
| M | select | 8, 20, 40 | 20 | — | Estimator noise of the decomposition |
| σ | range | [0, 0.8] | 0.25 | 0.05 | Irreducible error |
| n | select | 20, 30, 50 | 30 | — | Variance falls with n |
| Run | button | — | — | — | Batch: M × |D| fits |

### 7.4 Outputs

On a grid \(x^{(g)}\), g = 1..G, G = 101 in `[-1,1]`:

\[
\bar g(x)=\frac1M\sum_{m=1}^M \hat g_m(x)
\]
\[
\widehat{\mathrm{Bias}}^2(x)=\bigl(\bar g(x)-f(x)\bigr)^2
\]
\[
\widehat{\mathrm{Var}}(x)=\frac1{M-1}\sum_{m=1}^M \bigl(\hat g_m(x)-\bar g(x)\bigr)^2
\]

Integrated with the arcsine measure (average over the grid **or** over arcsine nodes — pick arcsine nodes to match training; **NEEDS VERIFICATION** that the plotted “expected MSE” matches \(\frac1G\sum_g[\widehat{\mathrm{Bias}}^2+\widehat{\mathrm{Var}}]+\sigma^2\) within sampling error).

Display: mean bias², mean var, σ², sum, and mean squared error of the M models vs f on the grid.

> ### **[CORRECTED 2026-08-28] Use the \(M-1\) divisor. This is decided, not a preference.**
>
> The \(1/M\) version is **biased low by a factor \((M-1)/M\)** — that is **12.5% at \(M=8\)**, which is one of this document's own offered settings. Variance fanning out is the *entire point* of the lab, so systematically shrinking the variance bars by an eighth is not an acceptable rounding choice. The formula above (\(1/(M-1)\)) is correct as written; keep it and document it.
>
> **Second-order issue this document originally missed.** The plug-in bias estimator \((\bar g - f)^2\) is **biased upward** by \(\mathrm{Var}(\hat g)/M\), because \(\bar g\) is itself a noisy estimate of \(\mathbb{E}[\hat g]\). So the stacked bars **overstate bias²** — and they do so in exactly the direction that *flatters* the decomposition, making the classical story look tidier than the data. Two honest remedies; ship at least one:
>
> - **(a) Debias:** plot \((\bar g - f)^2 - \widehat{\mathrm{Var}}/M\), clipped at 0.
> - **(b) Overlay a check:** keep the plug-in bias, and additionally draw the direct estimator \(\frac1M\sum_m (\hat g_m - f)^2\), which is **unbiased for bias² + variance with no correction at all**. Any gap between it and the stacked total is then visible on screen — honesty by construction rather than by footnote.
>
> Keep this document's own existing rule as well: **the bars must not be labelled "test MSE on a holdout."** They are grid-versus-\(f\) plus a known \(\sigma^2\), which is a different quantity.

The identity

\[
\mathbb{E}[(\hat g(x)-y)^2]=\mathrm{Bias}^2(x)+\mathrm{Var}(x)+\sigma^2
\]

holds for \(y=f(x)+\varepsilon\) independent of the training sample. Finite M makes the *displayed* bars approximate.

### 7.5 Visualization

1. **Spaghetti:** M fitted curves (low opacity) + mean curve + dashed truth. This is the aha. Linear axes, y clipped `[-4,4]`.
2. **Stacked bars or lines vs degree:** bias², variance, σ² (horizontal reference). Linear y. Do not use log (σ² would vanish visually or dominate).

### 7.6 Model

Independent OLS Chebyshev fits, degree d, engine default ridge (**[CORRECTED]** `RIDGE = 1e-8` × mean Gram diagonal, not an absolute `1e-10`), cap d ≤ 12.

### 7.7 Expected behavior

d = 0: high bias, low variance (almost parallel constants). d = 3: low bias, moderate var. d = 12: bias small, spaghetti explodes. σ ↑ raises the noise floor and the fan.

If M = 8, variance bars jitter — note “M is small.”

### 7.8 Explanation / aha

“Each faint line is a different dataset from the same process. Complexity makes them disagree. Disagreement *is* variance.”

### 7.9 Hazards

Same polynomial cap. M = 40 × 7 degrees × one fit: still OK on main thread with yields (~280 fits of p≤13). **Batch + progress + yield; worker if we later raise M or d.** Do not interpret a wiggly bias² vs d (Monte Carlo) as a real double dip.

> ### ✅ **[VERIFIED 2026-08-28] Numerical safety of this lab is CONFIRMED — under its own cap, and only under its own cap.**
>
> Measured across the whole \(d \le 12\) grid at \(n_{\text{train}} = 40\): \(\kappa(\mathbf{X}) \lesssim 2\) and \(\lVert\theta\rVert_2 \le 0.73\). That is not "acceptable," it is comfortable — the cap is what makes this lab viable at all.
>
> **The cap must be enforced in code, not only in prose.** Nothing currently enforces it. A `maxDegree` constant that only lives in a markdown table is not a guard; validate it in `defaultConfig()` / `validate(config)` and reject out-of-range values at the boundary. For contrast, the same estimator is **not** safe at \(d \gtrsim 40\) with \(n = 80\).

### 7.10 Cost

O(M |D| n p²). Defaults: interactive in < 200 ms on desktop. Use Run, not live-on-drag for M.

### 7.11 Misleading risks

Spaghetti autoscale. Stacking bias²+var+σ² as “test MSE” without the caveat that this is grid-vs-f, not a holdout. Students may think variance is “error among test points.” Caption **disagreement among models**.

---

## 8. Proposed experiment 7 — Logistic decision boundary

### 8.1 Learning objective

**A linear classifier is a line in the plane whose orientation is the weight vector; if two classes are linearly separable, unregularized maximum likelihood drives \(\|\theta\|\to\infty\).**

### 8.2 Inputs

Student-authored 2-D points, classes \(y\in\{0,1\}\). Defaults: two blobs,

\[
x \sim \mathcal{N}(\mu_y, 0.15^2 I_2),\quad
\mu_0=(-0.4,-0.2),\; \mu_1=(0.4,0.2),\quad
n=24
\]

in the window `[-1,1]²`, seed 42. Click to add a point of the active class; drag to move.

### 8.3 Controls

Active class, add/delete, α, T, L2 λ (default **0.01**, not 0 — see hazards), Play/Step, Reset, “make separable” / “add overlap” presets.

### 8.4 Outputs

\[
p_i=\sigma(w_1 x_{i1}+w_2 x_{i2}+b),\quad
L=-\frac1n\sum_i \bigl[y_i\log p_i+(1-y_i)\log(1-p_i)\bigr]
\]

Stable log-loss: `log1p(-p)` / `log(p)` with p clipped to `[10^{-12}, 1-10^{-12}]` after stable σ.

Gradient: \(\nabla_\theta L = \frac1n X^\top (p-y)\) with rows of X = `[x1, x2, 1]`.

GD as in lab 2. Display w, b, L, accuracy (threshold 0.5), \(\|\theta\|_2\).

### 8.5 Visualization

Scatter (two colors, not train/test meaning — use a new `--class0/--class1` or reuse with a caption). Decision line \(w\cdot x+b=0\). Optional heatmap of p ∈ (0,1). Linear axes, fixed `[-1.05,1.05]²`.

### 8.6 Model

Bernoulli GLM, logit link, full-batch GD. **Not** Newton/IRLS in v1 (Hessian \(X^\top W X\) with \(W=\mathrm{diag}(p(1-p))\) vanishes under separation).

### 8.7 Expected behavior

Overlapping blobs: finite θ, p around 0.5 in the mix. Separable: with λ = 0, \(\|\theta\|\) grows every step, boundary still classifies train at 100%, p → 0/1. With λ = 0.01, θ stays finite. **Aha:** “Perfect train accuracy with exploding weights.”

**NEEDS VERIFICATION:** default α for this loss. Hessian scale is different from MSE lab 2; do **not** reuse α_crit = 2/λ_max(MSE Hessian). Either compute λ_max of \(\frac1n X^\top W X\) at the current p (changes every step — messy) or empirically cap α ≤ 0.5 and halt on non-finite L. Document whichever ships.

### 8.8 Hazards

Complete separation + λ = 0: divergence (the lesson). Guard: halt at \(\|\theta\| > 50\) or non-finite L; badge “weights diverging (separable data).” p=0/1 log-loss: clip. Click-vs-tooltip: same SVG approach as lab 1.

### 8.9 Cost

n ≤ 80, T ≤ 300, d = 3. **Live Play on main thread.**

### 8.10 Misleading risks

Heatmap of p with a diverging color scale that looks like two “clusters” in empty space. A nonlinear-looking boundary from a coarse heatmap — draw the exact line. Using train/test blue/red for classes would collide with every other lab’s legend.

Momentum in this lab: same veto as §3 until the stability region is written down.

---

## 9. What we are *not* designing

| Idea | Why not (now) |
| --- | --- |
| In-browser neural net training | Many coupled hazards (init, φ, α, depth); activations + GD already teach the pieces |
| SVM / trees / boosting | Weaker live-math story; new solvers |
| k-NN overfitting | Numerically safest complexity knob, but redundant if polynomial overfitting is capped honestly. Revisit if Chebyshev stays untrustworthy after audit Stage 2 |
| PCA / t-SNE | Manipulation is less causal |
| Double-descent v2 | Exists; needs a numerical fix, not a redesign from this agent |

---

## 10. Priority ranking

Score 1–5. **Value** = unique insight from a *control*. **Cost** = new math UI + risk of a wrong claim. **Start** = value/cost, ties broken by curriculum order and reuse of `src/lib`.

| Rank | Lab | Value | Cost | Start | Why |
| --- | --- | --- | --- | --- | --- |
| **1** | Linear regression | 5 | 2 | P0 | First principles of loss; drag-a-point cannot be a textbook figure. O(n) closed form. Unlocks GD and overfitting conceptually. |
| **2** | Overfitting (capped) | 5 | 2 | P0 | Reuses dataset + Chebyshev + ErrorChart + ModelExplorer. The live degree slider is the only product delta vs a static U-curve. **Must ship the cap** or it inherits P3. |
| **3** | Gradient descent | 5 | 3 | P0 | Highest aha-per-pixel after lab 1: α_crit is *exact* for this quadratic. Needs a new contour primitive (the only pricey UI). Feature-scale slider is the static-figure killer. |
| **4** | Activations | 4 | 2 | P1 | Cheap, precise φ/φ'. Depth slider on log |δ| is unique. Unlocks any later net content. GELU/erf is the only fuzzy bit. |
| **5** | Ridge path | 4 | 2 | P1 | Almost free once λ is a solver argument. Directly teaches the knob the current engine hides as `RIDGE` (**[CORRECTED]** `1e-8`, relative to the mean Gram diagonal). Natural sequel to overfitting. |
| **6** | Bias–variance | 4 | 3 | P2 | The spaghetti plot is irreplaceable. Finite-M honesty is easy to get wrong (hence later). Batch, not live. |
| **7** | Logistic boundary | 4 | 3 | P2 | Opens classification. Separation-at-infinity is the aha. New color semantics, click-to-label UI, α_crit not inherited from lab 2. |
| — | Momentum GD | 3 | 3 | later | Do not ship a wrong (α,β) stability cartoon. |
| — | k-NN | 3 | 2 | later | Backup if polynomial overfitting cannot be made honest. |

**Implementation sequence:** labs 1 → 3 (GD uses the same (w,b) MSE) is a tight pair; lab 2 (overfitting) can proceed in parallel because it is mostly wiring existing functions behind a live slider. Activations are independent. Ridge is a thin slice of overfitting. Bias–variance and logistic wait until shared SVG-editable scatter and contour/heatmap primitives exist.

**Do not start overfitting until the degree cap and non-finite guards are in the spec’s acceptance tests.** Otherwise this site will ship a second liar.

---

## 11. Shared infrastructure (build once)

This is the audit R1/R4/T3/T4 work, specialized to these labs.

### 11.1 `ExperimentDefinition<C, R>`

Topic-agnostic module object (one file per lab, registered in a list):

- `id`, `titleKey`, `mode: "live" | "batch"`
- `defaultConfig()`, `validate(config) → string | null` (English keys; i18n at the edge)
- `run(config, onProgress?) → R | Promise<R>`
- `analyze(result, locale) → string[]` (predicates only)
- `historySummary?(result)` optional; live labs may omit history or snapshot on Save

The hub (`ExperimentWorkspace` generalized) owns: config, result, selection, running, progress, error, history. Settings panel is driven by a **parameter schema** (slider / select / number / checkbox) so `Field` is not copy-pasted.

Double descent becomes the first registered batch experiment, not a special page-level snowflake.

### 11.2 Numerics (already in `src/lib`, extend don’t fork)

| Need | Existing | Change |
| --- | --- | --- |
| PRNG, Gaussian, shuffle | `random.ts` | none |
| Split | `dataset.ts` `trainTestSplit` | parameterize `trueFunction` |
| Chebyshev + predict | `regression.ts` | none |
| OLS / ridge | `linalg.ts` `minNormLeastSquares` | **[CORRECTED 2026-08-28]** **λ argument — still not implemented; still required.** The default is **not** `1e-10`: the engine applies `RIDGE = 1e-8` × mean Gram diagonal (relative). The new argument must state in its type/JSDoc whether it is **absolute** or **relative**, and the UI must display the same kind it passes. Decide before writing the slider (§4.3) |
| MSE, gap | `metrics.ts` | add RMSE, MAE, R², log-loss (clipped), `isFiniteModel` |
| Guards | missing | `assertFinite(θ, yhat, metrics)` used by every lab |
| Eigen 2×2 | not extracted | tiny helper for GD α_crit (do not run Jacobi on 2×2) |

**Worker:** not required for labs 1, 3 (capped), 4, 5. GD heatmap and bias–variance *can* stay on main thread at the specified sizes. Introduce the worker when any `run` exceeds ~30 ms per yield, as `experiment.ts` already comments. One worker protocol (cancel, progress, result) should exist before logistic animation gets fancy.

### 11.3 UI primitives

| Primitive | Today | Labs that need it |
| --- | --- | --- |
| `Field` slider/select | private in Settings | all |
| `Stat` / `Item` | duplicated | all |
| `EmptyChart` | duplicated 5× | all |
| Train/test scatter + fit line | DatasetChart, ModelExplorer | 3, 5, 6 |
| Error vs discrete x, log toggle, click-select | ErrorChart | 3, 5; GD loss-vs-t |
| `clampForLog` + raw tooltip | ErrorChart | GD, activations \|δ\| |
| **Editable SVG scatter** | **does not exist** | 1, 7 |
| **Canvas heatmap + polyline** | **does not exist** | 2, 7 (p heatmap) |
| Play/Pause/Step | does not exist | 2, 7 |
| AnalysisPanel | generic already | all |
| Chart colors from CSS vars | unused | all (fix T3 once) |

Do not add a chart library for contours. Canvas + SVG overlay is enough and stays dependency-free (project already has Recharts for 1-D series).

### 11.4 Run / reset lifecycle

- **Live:** `useMemo`/`useEffect` from config → result. Reset = `defaultConfig()`. Optional `Save snapshot` into history.
- **Batch:** current Run + progress + disable controls while running. Add **cancel** (ignore stale `run` completions — the hub does not have this today; without it, a slow GD Play overlapping a second Play will race).
- Selection: lab 3 reuses `selectedDegree`; GD uses `selectedIteration` for the same “click the curve to inspect” pattern.

### 11.5 Dataset generation

One factory:

```text
makeRegressionDataset({ f, n, noise, seed, split, xMeasure: "arcsine" | "uniform" | "even" })
```

Labs 1 (even x, no split), 2 (arcsine, no split, then scale), 3–6 (arcsine, split). Never copy Box–Muller into a component.

### 11.6 Honesty layer

Every lab’s `analyze` follows `buildAnalysisNotes`: no sentence without a predicate. Shared statuses: `ok | invalid-config | numerical-failure | diverged`. **Never** map `numerical-failure` to a pedagogical success (the DD “Possible” bug).

Acceptance tests (extend `scripts/selfcheck.ts` / future Vitest), one per lab, smallest failing check:

| Lab | Must assert |
| --- | --- |
| 1 | Recover (0.8, 0.15) at σ=0; reject identical x |
| 2 | **[VERIFIED — shippable verbatim]** H_{22}=2 (measured exactly 2.0000); seed-42 α_crit ∈ (0.7, 1.3) (measured 0.99503); at s=10, α_crit ≈ 0.0203 so the default α=0.2 diverges (L grows) |
| 3 | **[VERIFIED]** σ=0, d=3 recovers Chebyshev [0, 0.2, 0, 0.7] exactly; d=12 test MSE > d=3 test MSE on the golden seed **or** the lab shows `unclear`, never a fake U. **Add:** assert the reported best-degree copy is a *plateau* statement at the defaults (argmin is 4, not 3), and assert `maxDegree ≤ 12` is rejected in `validate`, not merely documented |
| 4 | stable σ(±1000) finite; ReLU all-dead ⇒ δ=0; sigmoid L=1, z=0, w=1 ⇒ φ'=0.25 |
| 5 | λ→∞ ⇒ ‖θ‖→0 |
| 6 | d=0 variance < d=12 variance on golden seed |
| 7 | separable + λ=0 ⇒ ‖θ‖ increases over T steps |

---

## 12. Numerical-hazard summary (all labs)

The **most serious** hazard is **reusing unbounded Chebyshev OLS** (the shipped P3) inside overfitting / ridge / bias–variance. A student dragging “complexity” would again see a 10⁶ spike and a story about generalization. Mitigation: **degree cap 12**, finite checks, no DD detector, linear y default.

Second: **GD without a halt** writes Inf into charts and can freeze the tab. Mitigation: L_max, isFinite, boundary arrow.

Third: **naive exp in activations** (NaN in φ, silent). Mitigation: stable σ/softplus.

Fourth: **singular OLS** (lab 1 all-x-equal) if routed through tiny ridge — a fake slope. Mitigation: S_xx check first.

Fifth: **logistic separation** — not a bug if labeled divergence; a bug if it looks like a crisp confident classifier with no warning.

---

## 13. Index of `NEEDS VERIFICATION`

Items a math reviewer or implementer must close before the corresponding lab is marked correct. None of these are licensed to be “fudged in the UI.”

1. **Root cause of the existing high-degree blow-up** (audit §3.3) — **partly closed, and escalated.** Conditioning is now measured (Research B §16.4, §16.5a): the driver is \(p\to n\), and the relative ridge floors \(\kappa\) at \(\approx 4.6\times10^{8}\). What remains open is the *science*: whether this estimator can produce an honest second descent. That is now a **BLOCKING** issue — see `docs/phase2-synthesis.md`. This spec still only avoids the problem with a cap.
2. ~~**Whether cubic defaults produce a U-shaped test curve** with min near d=3~~ — **[CLOSED 2026-08-28]**. The U-shape is real (train 0.261→0.034, test up to 0.206). The min is **degree 4, not 3**, with 3/4/5 a 4.5% plateau. **New open constraint instead:** copy must report a plateau and must handle seed fragility (seed 1 shows no overfitting at all). See §4.2.
3. ~~**GD default-seed α_crit band** at s=1~~ — **[CLOSED 2026-08-28]**. Measured 0.99503 vs analytic 0.99418. \(\bar x = 0.0548\) lifts \(\lambda_{\max}\) by 0.6%. Ship the selfcheck anyway (§3.6).
4. ~~**Noiseless scaled-feature OLS** \(w^\star \approx 0.8/s\)~~ — **[CLOSED 2026-08-28]**. \((0.79510, 0.16319)\) at \(s=1\); \((0.07951, 0.16319)\) at \(s=10\) (§3.2).
5. ~~**Hessian factor** locked to this MSE (H_{22}=2)~~ — **[CLOSED 2026-08-28]**. Measured \(H_{22} = 2.0000\) exactly. The warning still stands: a silent switch to \(\frac1{2n}\sum r^2\) would double every α threshold, so keep the selfcheck (§3.4, §3.7).
6. **Momentum stability region** — **still open.** Out of v1 until written exactly (§3.3, §8).
7. ~~**`Math.erf` / GELU** portability~~ — **[CLOSED 2026-08-28] by correction, not by verification**: `Math.erf` **does not exist in ECMAScript**. Implement erf or ship the labelled tanh approximation. Not a portability question (§5.6).
8. ~~**PyTorch ReLU / leaky ReLU derivative at 0**~~ — **[REMOVED 2026-08-28]**. The "matches PyTorch" claims are deleted; the site states its own convention (\(\varphi'(0)=0\) for ReLU, \(1\) for leaky ReLU). Nothing to verify (§5.4, §5.6).
9. **Sigmoid chain:** **still open as a writing rule.** Do not publish \(\delta_L=(1/4)^L\) as the measured value; bound vs recurrence (§5.7).
10. **Ridge effective df trace formula** — **still open.** Show it only if implemented; don’t approximate with a hand-wavy “df ≈ p / (1+λ)” (§6.4).
11. ~~**Bias–variance:** `M` vs `M-1`~~ — **[DECIDED 2026-08-28]: use \(M-1\).** \(1/M\) is biased low by 12.5% at \(M=8\). **New requirement added:** the plug-in bias estimator is biased *upward* by \(\widehat{\mathrm{Var}}/M\) and must be debiased or cross-checked against the direct estimator. Grid-average vs arcsine-weighted average is **still open**. The "not holdout test MSE" labelling rule stands (§7.4).
12. **Logistic GD α** — **still open.** Cannot reuse MSE α_crit; need a documented cap or a real local Lipschitz/Hessian bound (§8.7).
13. **DD detection constants and interpolation 1e-3 cutoff** — **still open and now demonstrably wrong in at least one regime.** `DD_THRESHOLDS` and `INTERPOLATION_MSE_THRESHOLD: 1e-3` are uncalibrated magic numbers; the `1e-3` cutoff is not noise-aware and misreports the interpolation threshold by 12 degrees at \(\sigma=1\). Not used in new labs; still poison the capstone module. See `docs/phase2-synthesis.md`.
14. **Recharts vs dedicated SVG for pointer-edit** — **still open.** Product decision, not math, but it blocks lab 1 if ignored.
15. **[NEW 2026-08-28] Student-facing λ: absolute or relative?** Must be decided and documented before the λ slider is written; the engine's λ is relative and the mean Gram diagonal moves with degree (§4.3, §11.2).
16. **[NEW 2026-08-28] Seed fragility in the overfitting lab.** Argmin across seeds {1,7,42,99,2024} = {7,3,4,4,3}; seed 1 shows no overfitting. Analysis notes must be able to say "this sample does not show a clean sweet spot" (§4.2).

---

## 14. Engineer notes (non-goals of this document)

- Do not implement these labs until audit Stage 2 is at least **scoped** for the capstone DD module; new polynomial labs must not wait for that fix if they obey the degree cap.
- i18n: new strings go in per-lab namespaces (audit T2/R6), not another 400-line blob, but that is a platform decision.
- This file is the math/UX spec. Types, component names, and file splits should follow the existing `src/lib` + `src/components` + `src/types` layout, generalized by §11.1.
