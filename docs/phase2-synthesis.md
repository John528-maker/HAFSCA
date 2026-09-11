# Phase 2 — Synthesis: the verified state of knowledge

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Branch:** `ml-platform-v2`
**Date:** 2026-08-28
**Role:** Architect / Reviewer. This document records what is **settled**, what was **measured**, and what is **still open**, after a rigorous verification pass over the four Phase 1 research documents.
**Inputs:** `docs/phase1-research-a-ml-concepts.md`, `docs/phase1-research-b-math-foundations.md`, `docs/phase1-research-c-experiments.md`, `docs/phase1-research-d-learning-architecture.md`, `docs/phase0-project-audit.md`, and direct measurement against `src/lib/`.

This is the input the implementation plan should read. The four research documents remain the detail; this file is the contract.

---

## 0. Read this first

One thing on this page used to block work: **§3**. That question is now **settled negatively**. Lesson prose may describe the measured variance explosion and partial recovery; it still must not promise a competitive second descent as the default.

---

## 1. Locked decisions

These are settled. Treat them as constraints on implementation, not as options to revisit. Each one was checked against the code or agreed by both of the documents that touch it.

### 1.1 Loss convention

$$
J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}(\hat y_i-y_i)^{2}
$$

**No \(\tfrac12\) factor.** Verified to match `src/lib/metrics.ts`. Research B §2.3 and Research C §3.4 agree independently, and the consequence was measured: the Hessian entry \(H_{22}\) is **exactly 2.0000** on the real engine, which is only true without the \(\tfrac12\).

Consequence that must not be lost: every learning-rate threshold in the gradient-descent lab is tied to this convention. A silent switch to \(\frac{1}{2n}\sum r^2\) would **double** \(\alpha_{\mathrm{crit}}\). Keep the \(H_{22}=2\) selfcheck.

### 1.2 Residual convention

$$
\mathbf r=\mathbf X\boldsymbol\theta-\mathbf y \qquad\text{(prediction minus target)}
$$

This is the convention of Research B §2.2 and Research C §3.4, and it is the one under which the gradient \(\partial L/\partial w=\frac{2}{n}\sum_i x_i r_i\) is correct. Both documents contained violations of their own rule; both are now fixed. **Under the opposite sign that gradient descent would ascend the loss** — this was the most dangerous single defect found in the four documents, precisely because it is a formula an engineer types in directly.

Everything squared downstream (SSE, MSE, RMSE, \(R^2\), orthogonality checks) is sign-invariant, so no numeric result anywhere depends on this. Only signed residual readouts and stem directions do.

### 1.3 Parameter count

\(p = d + 1\) for a degree-\(d\) polynomial. Matches `regression.ts` (`paramCount = degree + 1`). Never call the degree \(n\); \(n\) is the training-sample count.

### 1.4 Math rendering

**MDX + server-side KaTeX.** Confirmed by a real spike, not inferred:

- Builds and statically prerenders on **Next 16.3.3 with Turbopack**.
- **Client-JS delta for an MDX route: 0 bytes.** `katex.min.js` appears in **no client chunk**. MathML is present in the HTML.
- Plugins **must** be named as **strings** — Turbopack cannot serialize JS functions to Rust.
- **`src/mdx-components.tsx` is mandatory.**
- Resolved versions: `@next/mdx` **16.3.3**, `@mdx-js/loader` **3.1.1**, `@mdx-js/react` **3.1.1**, `remark-math` **6.0.0**, `rehype-katex` **7.0.1**, `katex` **0.18.4**.
- Configure `rehype-katex` with **`strict: true, throwOnError: true`**. This is a deliberate **accuracy safeguard**: malformed TeX fails the build instead of silently rendering wrong mathematics.

Dynamic import by slug also works: ``await import(`@/content/${lang}/${slug}.mdx`)`` combined with finite `generateStaticParams`, `dynamicParams = false`, and locale/slug allowlists. Both locale files were discovered and prerendered. **The static import-map fallback is not needed and should not be built.**

### 1.5 Locale in the URL

`/{lang}/learn/{slug}` — **not** `localStorage`. Decided by the project owner. This also fixes the current defect where Korean users see English on first paint.

Corollary that must be written into the abstraction: **the experiment client island receives `lang` as a prop** from the server component. It must not re-derive locale from context or storage, or the existing "analysis notes computed twice, one copy in the wrong language" defect gets rebuilt structurally.

### 1.6 Curriculum order

**Research D §1.2 is authoritative.** Research B §17 has been demoted to a *mathematical dependency graph* — a prerequisite chain for checking that no lesson uses an undefined object. It is not a shipping order, and B now says so.

D §1.2 is now **18 nodes**: `normal-equations` (after `optimization`) and `conditioning` (between `interpolation-threshold` and `double-descent`) were added. Conditioning's omission mattered — it is the actual explanation of the flagship module's behaviour, so without it the capstone has a phenomenon and no mechanism.

---

## 2. The verification record

What was actually measured, as distinct from what was reasoned.

### 2.1 Research B's mathematics

**Every derivation and every worked numerical example in §§4–15, §16.1–16.3 and §16.6–16.8 was independently recomputed and found correct.** That is the majority of the document and it can be built on without re-deriving anything. The corrections applied to B were confined to a reversed word, symbol overloading, sign consistency with its own stated convention, a stale constant, an unverifiable citation, and framing.

### 2.2 Conditioning — measured on this repo

**Monomial basis, arcsine nodes** (this replaces a secondhand exponential prefactor that could not be traced to a primary theorem):

| degree \(d\) | measured \(\kappa(\mathbf X)\) |
| --- | --- |
| 5 | \(4.6\times10^{1}\) |
| 10 | \(3.7\times10^{3}\) |
| 15 | \(3.0\times10^{5}\) |
| 20 | \(3.1\times10^{7}\) |

\(\log_{10}\kappa\) grows by **0.389 per degree**, i.e. a factor of \(10^{0.389}\approx 2.45\), which matches \((1+\sqrt2)=2.414\) to measurement accuracy. Cite the measurement, not the constant.

**Chebyshev basis, arcsine nodes:** \(\kappa\) is **flat, between roughly 1.5 and 3, up to \(d\approx20\)** — no exponential regime at all. Past that it accelerates **far faster than any fixed exponential**, and the driver is **\(p \to n\)** (the design matrix becoming square on random nodes), **not the basis**. Getting this attribution right matters pedagogically: the late blow-up is running out of samples, not "high-degree polynomials are ill-conditioned."

**Resolution limit:** beyond \(d\approx78\) the smallest Gram eigenvalue computes as \(\approx -10^{-15}\) — negative, i.e. below the float64 resolution of \(\lambda_{\max}\approx188\). **Condition numbers printed beyond that point are not meaningful digits** and must never be shown to a student as measurements.

**What the relative ridge does.** It **floors** the condition number at

$$
\kappa \;\approx\; \frac{\lambda_{\max}}{\texttt{RIDGE}\cdot\overline{\mathrm{diag}}} \;\approx\; 4.6\times10^{8}\qquad \text{for all } d\ge78 .
$$

**That single number is the entire mechanism of the fix**, and \(1/\texttt{RIDGE}\) is the knob that sets the ceiling.

### 2.3 The basis/measure contrast — excellent teaching material

At \(d=40\):

| setup | \(\kappa\) |
| --- | --- |
| Chebyshev + **arcsine** sampling | \(\approx 16\) |
| Chebyshev + **uniform** sampling | \(\approx 1.4\times10^{6}\) |

A **\(10^5\) difference driven by the sampling measure, not the basis.** Same polynomials, same degree, same solver — only where you drew the points changed. This is a better lesson than the monomial-versus-Chebyshev comparison usually offered, because it isolates a variable students never think to consider.

### 2.4 The gradient-descent lab — fully verified

| quantity | predicted | measured | agreement |
| --- | --- | --- | --- |
| \(H_{22}\) | exactly 2 | **2.0000** | exact |
| \(\alpha_{\mathrm{crit}}=2/\lambda_{\max}\), \(s=1\), seed 42 | 0.99418 | **0.99503** | 0.09% |
| \(\alpha_{\mathrm{crit}}\), \(s=10\) | \(\approx0.02\) | **0.02030** | ✓ |
| noiseless OLS \((w,b)\), \(s=1\) | \((0.8,0.15)\) | **(0.79510, 0.16319)** | ✓ |
| noiseless OLS \((w,b)\), \(s=10\) | \((0.08,0.15)\) | **(0.07951, 0.16319)** | ✓ |

The engineered "aha" works exactly as specified: the default \(\alpha=0.2\) diverges at \(s=10\). The flagged \(\bar x \ne 0\) caveat is real but negligible — \(\bar x = 0.0548\) lifts \(\lambda_{\max}\) from 2 to 2.0117, a 0.6% effect. **This is the best-specified lab in the set; its acceptance tests can be shipped verbatim.**

### 2.5 The overfitting lab — U-shape real, "degree 3" claim false

At the proposed defaults (cubic truth, seed 42, \(n=50\), \(\sigma=0.25\), \(n_{\text{train}}=40\), \(n_{\text{test}}=10\)):

- **argmin is degree 4, not 3.** Degrees 3/4/5 are a **4.5% plateau**: test MSE **0.0430 / 0.0412 / 0.0425**, indistinguishable on 10 test points.
- The U-shape itself is real and pedagogically excellent: train MSE falls monotonically **0.261 → 0.034** while test MSE rises to **0.206**, a **4.8×** rise.
- **Left arm is non-monotone:** test(2) = 0.330 > test(1) = 0.253. Not a bug — the truth is odd, so a degree-2 term can only fit noise. Needs a caption.
- At \(\sigma=0\), degree 3 recovers \([0, 0.2, 0, 0.7]\) exactly.

**Seed fragility (newly discovered).** Measured argmin across seeds \(\{1,7,42,99,2024\}\) = \(\{7,3,4,4,3\}\). **At seed 1 the lab breaks entirely**: argmin 7, test(12) = 0.068 vs test(3) = 0.060 — no visible overfitting. Seed is a student-facing control, so the analysis notes **must** be able to say *"this sample does not show a clean sweet spot."* Seed 42 is a defensible default.

**Hard UI constraint: no copy may say "the best degree is 3, which is the true degree." The data does not support it. Copy must report a plateau.**

### 2.6 Numerical safety under the cap

At \(n_{\text{train}}=40\), \(d\le12\): measured \(\kappa(\mathbf X)\lesssim2\) and \(\lVert\theta\rVert_2\le0.73\) across the whole grid. The cap is what makes the overfitting and bias–variance labs viable. It is **not** safe at \(d\gtrsim40\) with \(n=80\).

**The cap must be enforced in code, not only in prose.** Nothing currently enforces it.

---

## 3. Central scientific question — **settled negatively** (2026-08-28)

> ### **Can this estimator produce an honest second descent, with `secondMin < firstMin`, at a shippable configuration?**
> ### **No. A geometric second descent exists; a competitive return does not, reliably.**

Truth-target sweeps (`nTrain = 40`, test size 460, 24 seeds) against the production solver:

| σ | cap | ratio ± sd | seeds with ratio < 1 | seeds with ratio < 2 |
| --- | ---: | --- | ---: | ---: |
| 0.3 | 2560 | 18.83 ± 16.22 | 0/24 | 1/24 |
| 0.5 | 2560 | 8.10 ± 8.03 | 0/24 | 1/24 |
| 1.0 | 2560 | 2.50 ± 2.29 | 3/24 | 11/24 |

The interpolation peak is a **genuine variance explosion**, not a solver crash (the relative ridge floors κ at ≈ 4.6×10⁸, so float64 still has meaningful digits). Partial recovery is the honest default case. **Lesson copy may describe this measured behaviour. It must not promise a second descent that beats the first minimum.**

The bullets below are the **historical** failure modes that opened the question (tiny test set, absolute `1e-3` cutoff, `"Clear"` on a \(10^6\) peak). They are **fixed or superseded** in the current tree: theoretical interpolation threshold, ≥160-point reliability gate, truth-target primary MSE, and a verdict taxonomy that names variance explosion and partial recovery.

### What this still forbids

- **No lesson may promise a second descent that beats the first minimum.**
- L14 copy must describe the measured peak and partial recovery, and may show the dual metric (truth vs noisy labels) as a lesson in what test error measures.

Honest L14 prose is now allowed. Competitive / true-DD copy is allowed only as “reachable in some seeds / controls,” not as the default claim.

---

## 4. The uncalibrated-constants problem

A first-class engineering task, not a documentation cleanup.

| constant | where | status |
| --- | --- | --- |
| `CLEAR_RISE` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `CLEAR_DROP` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `RISE` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `DROP` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `COMPETITIVE_SECOND_MIN: 2` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `DIVERGENCE_RISE: 100` | `DD_THRESHOLDS` | hand-picked, uncalibrated |
| `INTERPOLATION_MSE_THRESHOLD: 1e-3` | analysis | hand-picked, **demonstrably wrong** at \(\sigma=1\) (see §3 ii) |

Every one of these is a magic number chosen by hand, and at least one is now shown to be wrong in a regime the product ships. The verdict tiers they drive are the product's central honesty claim. They need either a defensible derivation (noise-relative, scale-aware) or an explicit admission in the UI that the tier is a heuristic.

Related and still open: `RIDGE = 1e-8` is itself a chosen constant. It is *better* than the absolute `1e-10` it replaced — being relative makes it dimensionless as degree changes — but \(1/\texttt{RIDGE}\) sets the \(\kappa\) ceiling at \(4.6\times10^{8}\) (§2.2), and nothing has calibrated that ceiling against the phenomenon it is supposed to preserve.

---

## 5. Remaining open items

### 5.1 Still open — engineering can close these

| # | Item | Source |
| --- | --- | --- |
| 1 | **Absolute vs relative student-facing λ.** Must be decided and documented **before** the slider is written. The engine's λ is relative; the mean Gram diagonal was measured at ≈41 at \(p=41\) and ≈2.3 at \(p=161\), so the discrepancy moves as the student drags degree | C §4.3, §11.2; B §2.2 |
| 2 | **`minNormLeastSquares(X, y)` takes no λ argument.** The API change is real and still open. The new argument must carry an explicit absolute-or-relative contract in its type | C §11.2 |
| 3 | **Degree cap not enforced in code.** `d ≤ 12` exists only in prose; put it in `validate(config)` | C §4.9, §7.9 |
| 4 | **`Math.erf` does not exist in ECMAScript.** Implement erf, or ship the tanh approximation clearly labelled as an approximation. There is no fallback question | C §5.6 |
| 5 | **Momentum stability region** — out of v1 until the \((\alpha,\beta)\) set is written down exactly | C §3.3, §8 |
| 6 | **Logistic GD step size** — cannot reuse the MSE \(\alpha_{\mathrm{crit}}\); needs a documented cap or a real local bound | C §8.7 |
| 7 | **Ridge effective-df trace formula** — show it only if implemented | C §6.4 |
| 8 | **Bias–variance grid-average vs arcsine-weighted average** — pick one and document it. (The \(M\) vs \(M-1\) question is decided: **\(M-1\)**) | C §7.4 |
| 9 | **Bias² plug-in estimator is biased upward** by \(\widehat{\mathrm{Var}}/M\), in the direction that flatters the decomposition. Either debias — plot \((\bar g-f)^2-\widehat{\mathrm{Var}}/M\) clipped at 0 — or overlay the direct estimator \(\frac1M\sum_m(\hat g_m-f)^2\), which is unbiased for bias²+variance with no correction, so any gap is visible honesty | C §7.4 |
| 10 | **Seed fragility handling** — analysis notes must be able to emit "this sample does not show a clean sweet spot" | C §4.2 |
| 11 | **`PageProps<'/…'>` availability** until `next typegen` has seen the new routes | D §4.1 |
| 12 | **Hash scrolling** onto a newly navigated prerendered lesson with `data-scroll-behavior` | D §4.1 |
| 13 | **`localStorage` quota / private mode** with both history and progress keys | D §4.6 |
| 14 | **Cookie vs URL locale on first request** without `proxy.ts`; and `proxy.ts` + fully static prerender | D §3.5, §6.4 |
| 15 | **Renumber `order` to a contiguous 1…18** when `curriculum.ts` is authored, and set path membership for the two added nodes | D §1.2 |
| 16 | **Sigmoid chain writing rule** — never publish \(\delta_L=(1/4)^L\) as a measured value; it is a bound | C §5.7 |

### 5.2 Needs a human — cannot be closed by engineering

| # | Item | Why it needs a person |
| --- | --- | --- |
| A | **Audience mathematics background** | Inferred from student-facing copy and the existing lab, not from a stated HAFS syllabus. If the cohort already has multivariable calculus, three lessons compress; if not, they are load-bearing. Ask the school |
| B | **Study-time estimates** | Never piloted. Currently planning numbers. Only a first cohort can turn them into measurements |
| C | **Whether the `intuition` path survives without calculus** | May be enough; may produce a cargo-cult reading of double descent. Needs cohort observation |
| D | **Screen-reader quality** of KaTeX `htmlAndMathml` | No AT test has been run on this product, in either locale. NVDA / JAWS / VoiceOver, English and Korean |
| E | **Misconception frequencies** | Which student misconceptions actually occur, and how often, is asserted from experience and literature, not observed here |
| F | **Deployment target** — Node host vs static file host | `proxy.ts` and config redirects only work on a Node host. `output: 'export'` is currently unset. This is a product/ops decision |
| G | **Eight-stage lesson template as pedagogy** | A design hypothesis, not a replicated result. It rhymes with concrete-before-abstract, but no specific study was evaluated |

### 5.3 Out of scope, carried forward

Accounts and server persistence; quiz gating; a probability/MLE track; classification and cross-entropy as core nodes; deep-learning engineering (optimizer zoo, dropout recipes, GPUs); in-browser neural-net training; SVM / trees / boosting; PCA / t-SNE. None of these are refused permanently — they hang off `related` later without disturbing the spine.

---

## 6. Which documents are safe to implement from

- **Research A** — safe. Mathematics and citations sound and appropriately hedged; the most epistemically careful of the four. Only stale ridge references were corrected. Its item 7 is the blocking issue in §3, and it is now marked as such.
- **Research B** — safe for §§4–15 and §16 (all recomputed and correct), and for §18's rendering recommendation (confirmed by spike). §17 is a dependency graph, not an order.
- **Research C** — §3 (gradient descent) is shippable verbatim. §4 (overfitting) is safe **only** with the plateau copy rule, seed-fragility handling, and the cap enforced in code. §4.3/§11.2 (the λ slider) is **blocked** on the absolute-vs-relative decision. §7 (bias–variance) is safe under its cap with the \(M-1\) divisor and one of the two bias remedies.
- **Research D** — safe for structure, routing, content model and migration. The MDX/Turbopack risks are resolved. The experiment-reuse plan for nodes 4/11/12 is corrected and must not revert. Node 14 is gated on §3.

**Nothing that claims a default true double descent is safe to write.** Honest L14 copy about the variance peak and partial recovery is allowed.
