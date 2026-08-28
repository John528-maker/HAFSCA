# Phase 1 — Research B: Mathematical Foundations

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Branch:** `ml-platform-v2`
**Date:** 2026-08-28
**Role:** Research only. No source code was modified, created, or deleted. This is the only file written.
**Audience:** motivated high-school / first-year undergraduate students, plus a Mathematical QA reviewer who will check every formula line by line.
**Engine alignment:** formulas are written so they match the existing double-descent module (`src/lib/`) wherever that module already has a correct definition.

> **[VERIFIED 2026-08-28]** A rigorous verification pass independently recomputed **every derivation and every worked numerical example** in §§4–15, §16.1–16.3 and §16.6–16.8. All of that mathematics is **correct** and is unchanged by this revision. The corrections applied on 2026-08-28 are confined to: one reversed word in the §15.3 heading, residual-sign consistency in §15.1/§15.6, symbol overloading in §2/§11.1, the now-stale `RIDGE` constant (§1.2, §16.5, §19), the unverifiable Vandermonde prefactor and the framing of conditioning growth (§16.4, §16.5), unverified secondary claims about KaTeX/MathJax (§18.2), and the status of §17 as a *dependency graph* rather than a shipping order. Each edit carries an inline `**[CORRECTED]**` or `**[VERIFIED 2026-08-28]**` marker.

---

## 0. How to read this document

Every concept below has the same seven parts: definition, notation, formula (KaTeX-ready LaTeX), derivation, intuition, a hand-checkable numerical example, and the connection to a real training loop.

**Accuracy rule used while writing.** A formula appears unmarked only if it is a standard identity I would stake a review on. Anything I could not confirm from a textbook identity plus arithmetic is tagged `NEEDS VERIFICATION` with a precise uncertainty. Worked-example arithmetic was independently recomputed in a Node script before this file was written.

LaTeX in this file is the form implementers should pass to KaTeX. Display math uses `$$...$$`. Multi-line algebra uses `aligned` (KaTeX-supported). Vectors and matrices are bold (`\mathbf`), scalars are not.

---

## 1. What the existing site uses for math today

There is **no mathematics rendering system**. `package.json` has no `katex`, `mathjax`, `rehype-katex`, or `remark-math`. Lesson copy is ordinary HTML/React strings. Charts label axes with the letters `MSE`, not a typeset formula.

### 1.1 Notation that already appears in shipped UI copy

All of the following are **plain Unicode / ASCII**, not TeX.

| Location | What a student sees | Interpretation |
| --- | --- | --- |
| `src/lib/i18n.ts` dataset caption | `y = sin(2πx) + noise · x ~ arcsine[-1,1]` | Ground-truth function plus noise model. The `π` is a Unicode character. |
| Same file, Korean | `y = sin(2πx) + noise · x ~ arcsine[-1,1]` | Formula is not translated (good — keep it). |
| Error-chart axis | `MSE` / `MSE (log)` | Mean squared error of predictions vs targets. |
| Model explorer | `Training MSE`, `Test MSE`, `Generalization Gap`, `Polynomial Degree`, `Parameters` | Gap is `testMSE - trainMSE` (`src/lib/metrics.ts`). Parameters = degree + 1. |
| Settings hint | `Interpolation expected near degree ${deg} (train size ${nTrain})` | Threshold framed as a polynomial **degree**, not as a parameter count \(p\). |
| Concept cards | prose only: overfitting, interpolation threshold, double descent | No symbols. |
| About paragraph | “minimum-norm least squares”, “Chebyshev polynomial basis”, “arcsine-distributed inputs” | Named, not written as equations. |

### 1.2 Notation that exists only in code comments / identifiers

This is what the **engine** already believes, and it is the right thing for the curriculum to adopt.

| Location | Engine notation | Meaning |
| --- | --- | --- |
| `src/lib/linalg.ts:20-22` | \(\theta\), \(X\), \(y\), \(n\), \(p\), \(\lambda\) | Parameters, design matrix, targets, sample count, parameter count, ridge. Transpose written as MATLAB-style `X'`, not \(X^{\top}\). |
| Same | \(p \le n\): \(\theta = (X'X + \lambda I)^{-1} X'y\) | Primal ridge least squares. |
| Same | \(p > n\): \(\alpha = (XX' + \lambda I)^{-1} y\), \(\theta = X'\alpha\) | Dual min-norm ridge. |
| `src/lib/regression.ts:4-5` | \(T_0 = 1\), \(T_1 = x\), \(T_{k+1} = 2x T_k - T_{k-1}\) | Chebyshev polynomials of the first kind. |
| `src/lib/dataset.ts:5, 11` | \(y = \sin(2\pi x)\) on \(x \in [-1,1]\); \(x = \cos(\pi U)\) | Ground truth and arcsine sampling. |
| `src/lib/metrics.ts:1-13` | MSE \(= \frac{1}{n}\sum_i (\hat y_i - y_i)^2\) | **No** \(\tfrac12\) factor. |
| `src/lib/regression.ts:40` | `paramCount = degree + 1` | For a degree-\(d\) polynomial, \(p = d+1\). |
| `src/lib/linalg.ts:19, 45-50` | `RIDGE = 1e-8` | **[CORRECTED 2026-08-28]** \(\lambda\) is **relative**: the engine adds \(\lambda=\texttt{RIDGE}\cdot\overline{\mathrm{diag}}\) to the Gram (or dual Gram) matrix, where \(\overline{\mathrm{diag}}=\mathrm{trace}(\mathbf{G})/\dim\mathbf{G}\) is the mean diagonal entry. It is therefore dimensionless in the scale of the Gram, and still **not** scaled by \(n\) on an averaged loss. The old documentation of an *absolute* \(\lambda=10^{-10}\) is obsolete everywhere it appears. |

**Curriculum decision:** keep the engine’s \(\theta, n, p, X, y, \lambda\) and the engine’s MSE (factor \(1/n\), not \(1/(2n)\)). Replace the comment-style `X'` with \(X^{\top}\) in all student-facing math. Use \(d\) for polynomial degree so it is not confused with \(n\).

---

## 2. Notation conventions (source of truth)

This table is the single source of truth for the website. Future lessons, quizzes, and engine comments should match it. If a second source disagrees, this table wins.

### 2.1 Index sets and shapes

- Sample index \(i = 1,\ldots,n\) in mathematics. (JavaScript arrays are 0-based; never mix the two in one formula.)
- Parameter / feature index \(j = 1,\ldots,p\).
- Gradient-descent iteration index \(t = 0,1,2,\ldots\)
- All vectors are **columns**. A “row of \(X\)” is written \({\mathbf x}^{(i)\top}\) when it must be a row, or identified with the column \({\mathbf x}^{(i)}\in\mathbb{R}^{p}\) otherwise.
- Bold \(\mathbf{X},\boldsymbol{\theta},\mathbf{y}\) are vectors/matrices; unbold \(y_i,\theta_j,x\) are scalars. In prose we may say “the vector theta” without bolding every word.

### 2.2 The table

| Symbol | Type | Meaning | Do **not** use it for |
| --- | --- | --- | --- |
| \(n\) | scalar | Number of **training** samples (rows of \(\mathbf{X}\)) | Features, polynomial degree, full dataset size |
| \(N\) | scalar | Full dataset size (train + test). Existing default \(N=100\), train ratio \(0.8\), so \(n=\lfloor 0.8N\rfloor=80\) | Training-set size |
| \(p\) | scalar | Number of parameters = number of columns of \(\mathbf{X}\) | Samples |
| \(d\) | scalar | Polynomial **degree**. For a degree-\(d\) polynomial, \(p=d+1\) | Dataset size |
| \({\boldsymbol{\theta}}\in\mathbb{R}^{p}\) | vector | Model parameters (what we learn) | Data |
| \(\theta_j\) | scalar | \(j\)-th parameter | — |
| \({\boldsymbol{\theta}}^{(t)}\) | vector | Parameters at GD step \(t\) | — |
| \(x\) | scalar | A 1-D input, as in the existing module \(x\in[-1,1]\) | A feature vector |
| \({\mathbf x}^{(i)}\in\mathbb{R}^{p}\) | vector | Feature vector of training sample \(i\) (row \(i\) of \(\mathbf{X}\), as a column) | The raw scalar input |
| \(y_i\) | scalar | Target / label of sample \(i\) | A prediction |
| \({\mathbf y}\in\mathbb{R}^{n}\) | vector | All training targets | — |
| \(\hat y_i\) | scalar | Model prediction for sample \(i\) | A target |
| \(\hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta}\) | vector | All training predictions | — |
| \(\mathbf{X}\in\mathbb{R}^{n\times p}\) | matrix | Design / feature matrix. \(\mathbf{X}_{ij}\) is feature \(j\) of sample \(i\) | A single sample |
| \(f\) or \(f_{\boldsymbol{\theta}}\) | function | A model: \(\hat y = f_{\boldsymbol{\theta}}(x)\) | A loss |
| \(J(\boldsymbol{\theta})\) | scalar | **Training loss** (empirical risk), a function of parameters | Per-example loss |
| \(\ell_i(\boldsymbol{\theta})\) | scalar | Loss on sample \(i\) only. Always \(J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}\ell_i(\boldsymbol{\theta})\) | The training loss |
| \(\nabla J(\boldsymbol{\theta})\) | vector in \(\mathbb{R}^{p}\) | Gradient of the training loss | A partial derivative (those are scalars) |
| \(\dfrac{\partial J}{\partial \theta_j}\) | scalar | Partial derivative of \(J\) w.r.t. one parameter | The full gradient |
| \(\eta>0\) | scalar | Learning rate (step size) | Regularization |
| \(\lambda\ge 0\) | scalar | Ridge coefficient. **Say which of the three meanings you mean** — see the warning under this table | Learning rate, a convexity interpolation coefficient (use \(\gamma\)), an eigenvalue (use \(\lambda_{\max}\)) |
| \(\lambda_{\max}(\mathbf{A}),\lambda_{\min}(\mathbf{A})\) | scalar | **[CORRECTED]** Largest / smallest **eigenvalue** of a symmetric matrix. This is a *distinct reserved use* of the letter \(\lambda\); it is never the ridge coefficient. Always write the subscript and the argument | The ridge coefficient |
| \(\gamma\in[0,1]\) | scalar | **[CORRECTED]** Convexity interpolation coefficient in the definition of a convex function (§11.1). Formerly written \(\lambda\), which collided with ridge | The ridge coefficient, the GD iteration index \(t\) |
| \(\boldsymbol{\psi}\in\mathbb{R}^{p}\) | vector | **[CORRECTED]** A second, generic parameter vector used alongside \(\boldsymbol{\theta}\) in definitions (§11.1). Formerly \(\boldsymbol{\phi}\), which collided with the feature map | The feature map |
| \(\phi(x)\in\mathbb{R}^{p}\) | vector-valued function | Feature map (§4.2): \(\phi(x)=(T_0(x),\ldots,T_d(x))^{\top}\) | A parameter vector |
| \(T_k(x)\) | scalar | Chebyshev polynomial of the first kind, degree \(k\) | A matrix transpose |
| \(\mathbf{I}_p\) | matrix | \(p\times p\) identity | — |
| \(\mathbf{A}^{\top}\) | matrix | Transpose of \(\mathbf{A}\) | Inverse, pseudoinverse |
| \(\mathbf{A}^{-1}\) | matrix | Inverse (only when \(\mathbf{A}\) is square and invertible) | Pseudoinverse |
| \(\mathbf{X}^{+}\) | matrix | Moore–Penrose pseudoinverse | Inverse |
| \(\lVert\mathbf{v}\rVert_2\) | scalar | Euclidean (\(\ell_2\)) norm. May be written \(\lVert\mathbf{v}\rVert\) when the \(2\) is obvious | Other norms, unless specified |
| \(\kappa(\mathbf{A})\) | scalar | Condition number (2-norm unless a subscript says otherwise) | A loss |
| \(\sigma_{\max}(\mathbf{A}),\sigma_{\min}(\mathbf{A})\) | scalar | Largest / smallest singular value | Eigenvalues, unless \(\mathbf{A}\) is SPD |
| \(\mathbf{r}=\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\) | vector | Residual = **prediction minus target** (matches `metrics.ts`) | Target minus prediction |
| \(t\) | integer | Iteration index | A data point |

> ### ⚠ **[CORRECTED 2026-08-28] \(\lambda\) now has THREE possible meanings in this project. This is a shipped-bug risk, not a stylistic nit.**
>
> Any document, lesson, UI label, function argument or code comment that writes \(\lambda\) **must** say which of these it means:
>
> 1. **Absolute-on-Gram.** \(\lambda\) added directly to \(\mathbf{X}^{\top}\mathbf{X}\) (or \(\mathbf{X}\mathbf{X}^{\top}\)), as in the textbook objective \(\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_2^2+\lambda\lVert\boldsymbol{\theta}\rVert_2^2\). This is what §15.3 and §15.4C derive.
> 2. **\(n\lambda\)-on-averaged-loss.** \(\lambda\) attached to the *averaged* loss \(J(\boldsymbol{\theta})+\lambda\lVert\boldsymbol{\theta}\rVert_2^2\), which produces \((\mathbf{X}^{\top}\mathbf{X}+n\lambda\mathbf{I})\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}\). Differs from (1) by a factor of \(n\).
> 3. **Relative-to-Gram-diagonal (what the engine now actually runs).** \(\lambda_{\text{applied}} = \texttt{RIDGE}\cdot\overline{\mathrm{diag}}(\mathbf{G})\) with `RIDGE = 1e-8` (`src/lib/linalg.ts:19, 45-50`). The applied \(\lambda\) therefore *changes with the problem*: the mean Gram diagonal was measured at \(\approx 41\) at \(p=41\) and \(\approx 2.3\) at \(p=161\).
>
> Consequence: a student-facing “\(\lambda\)” slider over absolute values and the engine’s internal \(\lambda\) are **different numbers**, off by the mean Gram diagonal. Whether the exposed control is absolute or relative must be **decided and written down before anyone builds it** (see Research C §4.3 / §11.2).

### 2.3 Loss convention (important, because textbooks disagree)

The existing metric is

$$
J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}(\hat y_i-y_i)^{2}=\frac{1}{n}\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}.
$$

We **keep this**. Some textbooks use \(\frac{1}{2n}\) or \(\frac12\) so that a factor of \(2\) cancels in the gradient. That is a notational convenience, not a different model. On this site:

- charts and \(J\) always mean **mean** squared error (divide by \(n\));
- the gradient therefore carries a \(2/n\), not a \(1/n\);
- the **minimizer** is the same either way, because a positive constant does not change \(\arg\min\).

Ridge, when we discuss the **engine**, means

$$
\min_{\boldsymbol{\theta}}\ \lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}+\lambda\lVert\boldsymbol{\theta}\rVert_{2}^{2},
$$

i.e. \(\lambda\) is added to \(\mathbf{X}^{\top}\mathbf{X}\) or \(\mathbf{X}\mathbf{X}^{\top}\). If a future lesson writes ridge on the *averaged* loss \(J(\boldsymbol{\theta})+\lambda\lVert\boldsymbol{\theta}\rVert_{2}^{2}\), the linear system becomes \((\mathbf{X}^{\top}\mathbf{X}+n\lambda\mathbf{I})\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}\). Those two \(\lambda\)s are not the same number. Say which one you mean.

**[CORRECTED 2026-08-28]** And note that `linalg.ts` no longer implements either of those literally: it applies \(\lambda=\texttt{RIDGE}\cdot\overline{\mathrm{diag}}(\mathbf{G})\), a **third** convention. See the warning box in §2.2. Whenever this document writes “as in `linalg.ts`,” read it as “absolute-on-Gram, with the absolute value supplied by the relative rule.”

### 2.4 What we will not use

- \(w\) or \(\mathbf{w}\) for weights — the engine already says \(\boldsymbol{\theta}\).
- \(m\) for sample count — too easy to confuse with “model.”
- \(L(\boldsymbol{\theta})\) for training loss — reserved if we ever need a Lipschitz constant \(L\).
- \(X'\) in student-facing math — that is MATLAB. Write \(X^{\top}\).
- Calling polynomial degree \(n\) — \(n\) is samples.

---

## 3. The chain, in one page

Each link exists because the previous one created a question the next one answers.

1. **Function.** A model is a function: it maps an input to a prediction, \(\hat y=f_{\boldsymbol{\theta}}(x)\). Until we pick \(\boldsymbol{\theta}\), we do not have *one* function; we have a family.
2. **Loss function.** To pick \(\boldsymbol{\theta}\), we need a scalar score of “how wrong.” That score is \(J(\boldsymbol{\theta})\). For regression on this site, \(J\) is mean squared error.
3. **Derivative.** If \(J\) depended on a single number \(\theta\), the derivative \(J'(\theta)\) would tell us whether to increase or decrease \(\theta\), and how steeply.
4. **Partial derivative.** Real models have many parameters. Holding the others fixed, \(\partial J/\partial\theta_j\) answers the same question for one coordinate.
5. **Gradient.** Bundle every partial into one vector \(\nabla J(\boldsymbol{\theta})\). That vector points to the direction of fastest *increase* of \(J\).
6. **Gradient descent.** Walk the other way: \(\boldsymbol{\theta}\leftarrow\boldsymbol{\theta}-\eta\nabla J(\boldsymbol{\theta})\). Repeat. This is the default training loop for neural nets.
7. **Optimization.** Gradient descent is one algorithm for the problem \(\min_{\boldsymbol{\theta}} J(\boldsymbol{\theta})\). For linear least squares the same problem has a closed form (the normal equations). The existing site uses that closed form, not GD — it is solving the same optimization problem by a different method.

Linear algebra (vectors, matrices, products, transpose) is the language in which \(f_{\boldsymbol{\theta}}\), \(J\), \(\nabla J\), and the normal equations are actually written. Conditioning explains why a mathematically correct formula can still explode on a computer — which is the numerical story behind the existing high-degree polynomial module.

---

## 4. Function

### 4.1 Definition

A **function** \(f\) assigns to each allowed input exactly one output. We write \(y=f(x)\). The set of allowed inputs is the **domain**; the set of possible outputs is the **codomain**.

In machine learning the function we care about is the **model**: a prediction machine with adjustable knobs \(\boldsymbol{\theta}\),

$$
\hat y=f_{\boldsymbol{\theta}}(x).
$$

Changing \(\boldsymbol{\theta}\) changes which function we have. Training is the search for a useful \(f_{\boldsymbol{\theta}}\).

A model can be **nonlinear in the input** \(x\) and still **linear in the parameters** \(\boldsymbol{\theta}\). Polynomial regression is the standard example: \(\hat y=\theta_1+\theta_2 x+\theta_3 x^{2}\) is a parabola in \(x\), but it is a linear combination of the features \((1,x,x^{2})\).

### 4.2 Notation

- Scalar input \(x\), scalar prediction \(\hat y\), parameter vector \(\boldsymbol{\theta}\).
- When we have a feature map \(\phi(x)\in\mathbb{R}^{p}\) (monomials, or Chebyshev \(T_k\)), the linear-in-parameters model is \(\hat y=\boldsymbol{\theta}^{\top}\phi(x)\).

### 4.3 Formula

Generic model:

$$
\hat y=f_{\boldsymbol{\theta}}(x).
$$

Linear-in-parameters model (this site, one scalar input):

$$
\hat y=\sum_{k=0}^{d}\theta_{k+1}\,T_k(x)=\boldsymbol{\theta}^{\top}\phi(x),\qquad \phi(x)=\bigl(T_0(x),\ldots,T_d(x)\bigr)^{\top}.
$$

(The engine indexes coefficients from `0` in code; mathematically we still have \(p=d+1\) entries.)

### 4.4 Derivation

No derivation — this is a definition. The only algebraic fact we need immediately is that stacking \(n\) samples gives a matrix–vector product (Section 13):

$$
\hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta},\qquad \mathbf{X}_{i,:}=\phi(x_i)^{\top}.
$$

### 4.5 Intuition

A function is a consistent input–output rule. A model is a *template* for such a rule. The template is useless until we fill in \(\boldsymbol{\theta}\). Loss, derivatives, and gradient descent exist only to fill those knobs in.

### 4.6 Worked example

Let \(f(x)=2x+1\). Then \(f(3)=2\cdot 3+1=7\).

Now treat the slope as unknown: \(f_{\theta}(x)=\theta x+1\). For \(\theta=2\) we recover the previous function; for \(\theta=0\) we get the constant function \(1\). Same template, different functions.

Chebyshev check at \(x=\tfrac12\), using the engine’s recurrence \(T_0=1\), \(T_1=x\), \(T_{k+1}=2x T_k-T_{k-1}\):

$$
\begin{aligned}
T_0\bigl(\tfrac12\bigr)&=1,\\
T_1\bigl(\tfrac12\bigr)&=\tfrac12,\\
T_2\bigl(\tfrac12\bigr)&=2\cdot\tfrac12\cdot\tfrac12-1=-\tfrac12,\\
T_3\bigl(\tfrac12\bigr)&=2\cdot\tfrac12\cdot\bigl(-\tfrac12\bigr)-\tfrac12=-1.
\end{aligned}
$$

So a degree-3 Chebyshev model at \(x=\tfrac12\) predicts

$$
\hat y=\theta_1\cdot 1+\theta_2\cdot\tfrac12+\theta_3\cdot\bigl(-\tfrac12\bigr)+\theta_4\cdot(-1).
$$

### 4.7 Connection to ML

**Forward pass.** Given the current \(\boldsymbol{\theta}\) and a batch of inputs, the model evaluates \(f_{\boldsymbol{\theta}}\) to produce \(\hat{\mathbf y}\). On this site that is `predict` in `src/lib/regression.ts`: build \(\mathbf{X}\) from Chebyshev features, then \(\hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta}\).

**Why we need a loss next.** A function can be evaluated, but evaluation does not tell us whether \(\boldsymbol{\theta}\) is any good. We need a score.

---

## 5. Loss function

### 5.1 Definition

A **loss function** (here: the **training loss** \(J\)) is a scalar that measures how unhappy we are with the current parameters on the training set. Smaller is better. Training is the attempt to make \(J\) small.

The **per-example loss** \(\ell_i\) is the same idea for one sample. The training loss is the average:

$$
J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}\ell_i(\boldsymbol{\theta}).
$$

For regression on this site, the per-example loss is squared error \(\ell_i(\boldsymbol{\theta})=(\hat y_i-y_i)^{2}\). The average is **mean squared error (MSE)**.

A loss is a function of \(\boldsymbol{\theta}\), not of \(x\). The data \(({\mathbf x}^{(i)},y_i)\) are treated as fixed while we search over parameters.

### 5.2 Notation

- \(J(\boldsymbol{\theta})\): training loss.
- \(\ell_i(\boldsymbol{\theta})\): sample-\(i\) loss.
- Test loss uses the same formula on held-out samples; it is **not** \(J\). We may write \(J_{\mathrm{test}}\) in prose if needed. The existing UI calls it “Test MSE.”

### 5.3 Formula

$$
J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}\bigl(f_{\boldsymbol{\theta}}(x_i)-y_i\bigr)^{2}=\frac{1}{n}\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}.
$$

### 5.4 Derivation

Start from the definition of Euclidean norm:

$$
\lVert\mathbf{v}\rVert_{2}^{2}=\sum_{i=1}^{n}v_i^{2}.
$$

Set \(\mathbf{v}=\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\). Then

$$
\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}=\sum_{i=1}^{n}(\hat y_i-y_i)^{2}.
$$

Divide by \(n\):

$$
J(\boldsymbol{\theta})=\frac{1}{n}\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}.
$$

This is exactly `meanSquaredError` in `src/lib/metrics.ts` (`sum / predictions.length`).

### 5.5 Intuition

Each residual \(\hat y_i-y_i\) is “how far off we were.” Squaring does three jobs: it makes every error positive, it penalizes large misses more than small ones, and it makes the calculus later smooth (the map \(r\mapsto r^{2}\) is differentiable at \(0\); the map \(r\mapsto |r|\) is not). Averaging by \(n\) makes \(J\) comparable across dataset sizes: doubling the data should not automatically double the reported loss.

### 5.6 Worked example

Two training points: \((x,y)=(1,3)\) and \((2,5)\). One-parameter model \(\hat y=\theta x\) (no intercept). Then \(\mathbf{X}=\begin{pmatrix}1\\2\end{pmatrix}\), \(\mathbf{y}=\begin{pmatrix}3\\5\end{pmatrix}\), \(n=2\), and

$$
J(\theta)=\frac12\bigl[(\theta-3)^{2}+(2\theta-5)^{2}\bigr].
$$

At \(\theta=2\): predictions \(2\) and \(4\); errors \(-1\) and \(-1\);

$$
J(2)=\frac12\bigl[(-1)^{2}+(-1)^{2}\bigr]=1.
$$

At \(\theta=2.6=\frac{13}{5}\): predictions \(2.6\) and \(5.2\);

$$
J\bigl(\tfrac{13}{5}\bigr)=\frac12\bigl[(2.6-3)^{2}+(5.2-5)^{2}\bigr]=\frac12(0.16+0.04)=0.1.
$$

(The value \(13/5\) will turn out to be the minimizer in Section 7.)

### 5.7 Connection to ML

After the forward pass, the training loop computes \(J\) (and, usually, a test MSE that is **not** used to choose \(\boldsymbol{\theta}\)). On this site, `meanSquaredError` is that computation. The generalization gap displayed in the UI is \(J_{\mathrm{test}}-J_{\mathrm{train}}\).

**Why we need a derivative next.** \(J(\theta)=1\) at \(\theta=2\) does not tell us whether to increase or decrease \(\theta\). The slope does.

---

## 6. Derivative

### 6.1 Definition

For a function \(g:\mathbb{R}\to\mathbb{R}\), the **derivative** at \(\theta\) is the slope of the best linear approximation:

$$
g'(\theta)=\lim_{h\to 0}\frac{g(\theta+h)-g(\theta)}{h},
$$

when the limit exists. If \(g'(\theta)>0\), a tiny increase in \(\theta\) increases \(g\). If \(g'(\theta)<0\), a tiny increase in \(\theta\) decreases \(g\).

### 6.2 Notation

- \(g'(\theta)\) or \(\dfrac{\mathrm{d}g}{\mathrm{d}\theta}\). We use \(\mathrm{d}\) (upright via `\mathrm{d}`) for ordinary derivatives of functions of one scalar, and \(\partial\) for partials.
- The loss as a function of one parameter is \(J(\theta)\).

### 6.3 Formula

Rules we will actually use (standard, listed without proof of the limit definition):

$$
\begin{aligned}
\frac{\mathrm{d}}{\mathrm{d}\theta}(\theta^{k})&=k\theta^{k-1}\quad(k\neq 0),\\
\frac{\mathrm{d}}{\mathrm{d}\theta}\bigl(ag(\theta)+bh(\theta)\bigr)&=ag'(\theta)+bh'(\theta),\\
\frac{\mathrm{d}}{\mathrm{d}\theta}g(h(\theta))&=g'(h(\theta))\,h'(\theta)\qquad\text{(chain rule)}.
\end{aligned}
$$

Squared-error loss in one parameter, model \(\hat y=\theta x\):

$$
\frac{\mathrm{d}J}{\mathrm{d}\theta}=\frac{2}{n}\sum_{i=1}^{n}(\theta x_i-y_i)\,x_i.
$$

### 6.4 Derivation (one-parameter MSE, no skipped steps)

$$
J(\theta)=\frac{1}{n}\sum_{i=1}^{n}(\theta x_i-y_i)^{2}.
$$

Differentiate term by term. For a single \(i\), set \(u_i=\theta x_i-y_i\). Then \(\ell_i=u_i^{2}\) and, by the chain rule,

$$
\frac{\mathrm{d}\ell_i}{\mathrm{d}\theta}=2u_i\cdot\frac{\mathrm{d}u_i}{\mathrm{d}\theta}=2(\theta x_i-y_i)\cdot x_i,
$$

because \(\mathrm{d}(\theta x_i)/\mathrm{d}\theta=x_i\) and \(y_i\) does not depend on \(\theta\). Therefore

$$
\frac{\mathrm{d}J}{\mathrm{d}\theta}=\frac{1}{n}\sum_{i=1}^{n}2(\theta x_i-y_i)x_i=\frac{2}{n}\sum_{i=1}^{n}(\theta x_i-y_i)x_i.
$$

### 6.5 Intuition

The derivative is a local exchange rate: “if I nudge \(\theta\) up by a hair, how much does \(J\) change?” It does not, by itself, move \(\theta\). It only reports the slope.

### 6.6 Worked example

Continue Section 5.6: \(n=2\), \(x_1=1\), \(y_1=3\), \(x_2=2\), \(y_2=5\).

$$
J(\theta)=\frac12\bigl[(\theta-3)^{2}+(2\theta-5)^{2}\bigr].
$$

Differentiate:

$$
\begin{aligned}
J'(\theta)
&=\frac12\bigl[2(\theta-3)\cdot 1+2(2\theta-5)\cdot 2\bigr]\\
&=(\theta-3)+2(2\theta-5)\\
&=\theta-3+4\theta-10\\
&=5\theta-13.
\end{aligned}
$$

Check against the general formula:

$$
J'(\theta)=\frac{2}{2}\bigl[(\theta\cdot 1-3)\cdot 1+(\theta\cdot 2-5)\cdot 2\bigr]=(\theta-3)+2(2\theta-5)=5\theta-13.
$$

At \(\theta=2\): \(J'(2)=10-13=-3\). The slope is negative, so **increasing** \(\theta\) decreases \(J\). That matches the numbers: \(J(2)=1\) and \(J(2.6)=0.1\).

### 6.7 Connection to ML

In a one-parameter model, the backward pass is “compute \(J'(\theta)\).” The update \(\theta\leftarrow\theta-\eta J'(\theta)\) is already gradient descent (Section 10) in disguise.

**Why we need partials next.** Models on this site have \(p=d+1\) parameters, not one. A single ordinary derivative is not enough.

---

## 7. Partial derivative

### 7.1 Definition

For a function of several variables, the **partial derivative** with respect to \(\theta_j\) is the ordinary derivative you get by treating every other argument as a constant.

### 7.2 Notation

$$
\frac{\partial J}{\partial\theta_j}(\boldsymbol{\theta})\qquad\text{or}\qquad \partial_{\theta_j}J(\boldsymbol{\theta}).
$$

We use \(\partial\), never \(\mathrm{d}\), once there is more than one parameter.

### 7.3 Formula

For MSE with \(\hat y_i={\mathbf x}^{(i)\top}\boldsymbol{\theta}\):

$$
\frac{\partial J}{\partial\theta_j}=\frac{2}{n}\sum_{i=1}^{n}(\hat y_i-y_i)\,x^{(i)}_{j}.
$$

### 7.4 Derivation

$$
J(\boldsymbol{\theta})=\frac{1}{n}\sum_{i=1}^{n}\Bigl(\sum_{k=1}^{p}x^{(i)}_{k}\theta_k-y_i\Bigr)^{2}.
$$

Fix \(j\). Inside sample \(i\), let \(u_i=\sum_{k}x^{(i)}_{k}\theta_k-y_i\). Then

$$
\frac{\partial u_i}{\partial\theta_j}=x^{(i)}_{j},
$$

because every term with \(k\neq j\) is constant with respect to \(\theta_j\). Chain rule on \(u_i^{2}\):

$$
\frac{\partial}{\partial\theta_j}(u_i^{2})=2u_i\,x^{(i)}_{j}=2(\hat y_i-y_i)\,x^{(i)}_{j}.
$$

Average over \(i\):

$$
\frac{\partial J}{\partial\theta_j}=\frac{2}{n}\sum_{i=1}^{n}(\hat y_i-y_i)\,x^{(i)}_{j}.
$$

### 7.5 Intuition

A partial answers: “if I turn **only** knob \(j\), and freeze the others, does the loss go up or down?” It is a one-knob question. Real training turns all knobs at once; that is the gradient.

### 7.6 Worked example

Let

$$
f(\theta_1,\theta_2)=\theta_1^{2}+\theta_1\theta_2+\theta_2^{2}.
$$

Treat \(\theta_2\) as constant and differentiate in \(\theta_1\):

$$
\frac{\partial f}{\partial\theta_1}=2\theta_1+\theta_2.
$$

Treat \(\theta_1\) as constant and differentiate in \(\theta_2\):

$$
\frac{\partial f}{\partial\theta_2}=\theta_1+2\theta_2.
$$

At \((\theta_1,\theta_2)=(1,2)\):

$$
\frac{\partial f}{\partial\theta_1}=2\cdot 1+2=4,\qquad \frac{\partial f}{\partial\theta_2}=1+2\cdot 2=5.
$$

And \(f(1,2)=1+2+4=7\).

(This \(f\) is not a data loss. It is a tiny strictly convex bowl we will reuse for gradient descent. The Hessian is \(\begin{pmatrix}2&1\\1&2\end{pmatrix}\), with eigenvalues \(3\) and \(1\), both positive, so the only critical point is a minimum.)

### 7.7 Connection to ML

Backpropagation’s last step, for each weight, is a partial \(\partial J/\partial\theta_j\). For linear least squares the partial has the closed form above; for a neural net the same idea is applied through each layer via the chain rule.

**Why we need the gradient next.** We have \(p\) separate slopes. We need one object that says “go this way in parameter space.”

---

## 8. Gradient

### 8.1 Definition

The **gradient** of a scalar function \(J:\mathbb{R}^{p}\to\mathbb{R}\) is the column vector of all partial derivatives:

$$
\nabla J(\boldsymbol{\theta})=\begin{pmatrix}\dfrac{\partial J}{\partial\theta_1}\\ \vdots\\ \dfrac{\partial J}{\partial\theta_p}\end{pmatrix}\in\mathbb{R}^{p}.
$$

It is the unique vector that satisfies, for every direction \(\mathbf{v}\),

$$
\lim_{h\to 0}\frac{J(\boldsymbol{\theta}+h\mathbf{v})-J(\boldsymbol{\theta})}{h}=\nabla J(\boldsymbol{\theta})^{\top}\mathbf{v},
$$

when \(J\) is differentiable. The right-hand side is the **directional derivative**. It is maximized (for \(\lVert\mathbf{v}\rVert_2=1\)) when \(\mathbf{v}\) points in the same direction as \(\nabla J\). So \(\nabla J\) is the direction of **steepest ascent**.

### 8.2 Notation

- \(\nabla J(\boldsymbol{\theta})\) for the gradient. Never write \(\nabla J\) without saying at which \(\boldsymbol{\theta}\) if the point matters.
- Component \(j\) is \(\bigl(\nabla J(\boldsymbol{\theta})\bigr)_j=\partial J/\partial\theta_j\).

### 8.3 Formula

MSE, linear-in-parameters model:

$$
\nabla J(\boldsymbol{\theta})=\frac{2}{n}\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}-\mathbf{y})=\frac{2}{n}\mathbf{X}^{\top}\mathbf{r}.
$$

### 8.4 Derivation (from partials to a matrix formula)

From Section 7,

$$
\frac{\partial J}{\partial\theta_j}=\frac{2}{n}\sum_{i=1}^{n}r_i\,X_{ij},\qquad r_i=\hat y_i-y_i.
$$

The right-hand side is entry \(j\) of \(\frac{2}{n}\mathbf{X}^{\top}\mathbf{r}\), because

$$
\bigl(\mathbf{X}^{\top}\mathbf{r}\bigr)_j=\sum_{i=1}^{n}X_{ij}r_i.
$$

And \(\mathbf{r}=\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\) by definition of \(\hat{\mathbf y}\). Therefore

$$
\nabla J(\boldsymbol{\theta})=\frac{2}{n}\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}-\mathbf{y}).
$$

**Chain-rule reading (same formula, different packaging).** View \(J\) as the composition

$$
\boldsymbol{\theta}\ \xrightarrow{\ \hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta}\ }\ \hat{\mathbf y}\ \xrightarrow{\ J=\frac{1}{n}\lVert\hat{\mathbf y}-\mathbf{y}\rVert_{2}^{2}\ }\ J.
$$

The inner derivative of \(\hat{\mathbf y}\) w.r.t. \(\boldsymbol{\theta}\) is the matrix \(\mathbf{X}\). The outer derivative of \(J\) w.r.t. \(\hat{\mathbf y}\) is \(\frac{2}{n}(\hat{\mathbf y}-\mathbf{y})\). The chain rule for this composition is “multiply those”:

$$
\nabla_{\boldsymbol{\theta}}J=\mathbf{X}^{\top}\cdot\frac{2}{n}(\hat{\mathbf y}-\mathbf{y}),
$$

which is the same formula. (The transpose appears because we convert a row-wise sensitivity into a column gradient; see Section 14.)

### 8.5 Intuition

If you stand on the loss surface at \(\boldsymbol{\theta}\), \(\nabla J(\boldsymbol{\theta})\) is the uphill compass. Each coordinate of that compass is one partial. Magnitude = steepness.

### 8.6 Worked example

**Pure calculus.** For \(f(\theta_1,\theta_2)=\theta_1^{2}+\theta_1\theta_2+\theta_2^{2}\) at \((1,2)\),

$$
\nabla f(1,2)=\begin{pmatrix}4\\5\end{pmatrix}.
$$

**MSE, matching Section 6.** \(\mathbf{X}=\begin{pmatrix}1\\2\end{pmatrix}\), \(\mathbf{y}=\begin{pmatrix}3\\5\end{pmatrix}\), \(\theta=2\):

$$
\mathbf{r}=\begin{pmatrix}2\\4\end{pmatrix}-\begin{pmatrix}3\\5\end{pmatrix}=\begin{pmatrix}-1\\-1\end{pmatrix},\qquad
\mathbf{X}^{\top}\mathbf{r}=1\cdot(-1)+2\cdot(-1)=-3,
$$

$$
\nabla J(2)=\frac{2}{2}(-3)=-3,
$$

which matches \(J'(2)=-3\).

### 8.7 Connection to ML

The backward pass’s output is \(\nabla J(\boldsymbol{\theta})\) (or a mini-batch estimate of it). Frameworks call this `loss.backward()`. For the existing site, this vector is never formed: the engine jumps to the exact minimizer via linear algebra (Section 15). A future GD lesson should compute this formula explicitly so students can see the same \(J\) the charts already plot.

**Why we need gradient descent next.** Knowing the uphill direction is useful only if we walk the other way.

---

## 9. Chain rule in a training step (the missing link, spelled out)

This is not a new object; it is the mechanism that produces \(\nabla J\) when the model is nested. Students meet it the moment the model is more than \(\boldsymbol{\theta}^{\top}\phi(x)\).

### 9.1 Definition

If \(J=g(u)\) and \(u=h(\theta)\), then

$$
\frac{\mathrm{d}J}{\mathrm{d}\theta}=g'(u)\,h'(\theta).
$$

In words: stretch factor of the outer map, times stretch factor of the inner map.

### 9.2 Worked example (one sample, two parameters)

Model \(\hat y=\theta_1 x+\theta_2\), sample \((x,y)=(2,5)\), parameters \((\theta_1,\theta_2)=(1,1)\). Then \(\hat y=3\) and the sample loss is \(\ell=(\hat y-y)^{2}=(3-5)^{2}=4\).

Outer: \(\dfrac{\mathrm{d}\ell}{\mathrm{d}\hat y}=2(\hat y-y)=2(-2)=-4\).

Inner: \(\dfrac{\partial\hat y}{\partial\theta_1}=x=2\), \(\dfrac{\partial\hat y}{\partial\theta_2}=1\).

Chain rule:

$$
\frac{\partial\ell}{\partial\theta_1}=(-4)\cdot 2=-8,\qquad \frac{\partial\ell}{\partial\theta_2}=(-4)\cdot 1=-4.
$$

**Check by expanding.** \(\ell(\theta_1)=(2\theta_1+1-5)^{2}=(2\theta_1-4)^{2}\), so

$$
\frac{\mathrm{d}\ell}{\mathrm{d}\theta_1}=2(2\theta_1-4)\cdot 2=4(2\theta_1-4).
$$

At \(\theta_1=1\): \(4(2-4)=-8\). Matches.

This is backpropagation on a network with one linear neuron and no activation.

---

## 10. Gradient descent

### 10.1 Definition

**Gradient descent (GD)** is the iteration

$$
\boldsymbol{\theta}^{(t+1)}=\boldsymbol{\theta}^{(t)}-\eta\,\nabla J\bigl(\boldsymbol{\theta}^{(t)}\bigr),
$$

with learning rate \(\eta>0\). Each step moves a distance \(\eta\lVert\nabla J\rVert_2\) in the direction of steepest *descent*.

**Batch GD** uses the full training set in \(J\). **Mini-batch SGD** replaces \(\nabla J\) by an average over a random subset. The update rule is the same shape.

### 10.2 Notation

- \(\boldsymbol{\theta}^{(t)}\): parameters at iteration \(t\).
- \(\eta\): learning rate, a positive scalar we choose. It is not learned (unless a later lesson introduces schedules / adaptive methods).

### 10.3 Formula

General:

$$
\boldsymbol{\theta}^{(t+1)}=\boldsymbol{\theta}^{(t)}-\eta\,\nabla J\bigl(\boldsymbol{\theta}^{(t)}\bigr).
$$

For MSE linear regression, substitute Section 8:

$$
\boldsymbol{\theta}^{(t+1)}=\boldsymbol{\theta}^{(t)}-\eta\cdot\frac{2}{n}\mathbf{X}^{\top}\bigl(\mathbf{X}\boldsymbol{\theta}^{(t)}-\mathbf{y}\bigr).
$$

### 10.4 Derivation of the update (why minus, why \(\eta\))

We want a small step \(\boldsymbol{\Delta}\) such that \(J(\boldsymbol{\theta}+\boldsymbol{\Delta})<J(\boldsymbol{\theta})\). Differentiability gives the first-order approximation

$$
J(\boldsymbol{\theta}+\boldsymbol{\Delta})\approx J(\boldsymbol{\theta})+\nabla J(\boldsymbol{\theta})^{\top}\boldsymbol{\Delta}.
$$

To make the inner product negative, choose \(\boldsymbol{\Delta}\) opposite the gradient. The shortest such choice of a given length is a negative multiple of \(\nabla J\):

$$
\boldsymbol{\Delta}=-\eta\nabla J(\boldsymbol{\theta}),\qquad\eta>0.
$$

Then \(\nabla J^{\top}\boldsymbol{\Delta}=-\eta\lVert\nabla J\rVert_{2}^{2}\le 0\), with equality only at a critical point. Substituting \(\boldsymbol{\Delta}\) is the update rule.

This argument justifies the *direction*. It does **not** prove that a finite \(\eta\) decreases \(J\). If \(\eta\) is too large, the first-order approximation is a lie and \(J\) can increase. For an \(L\)-smooth function (gradient is Lipschitz with constant \(L\)), any \(\eta\in(0,2/L)\) is a descent step. For the quadratic MSE,

$$
\nabla^{2}J(\boldsymbol{\theta})=\frac{2}{n}\mathbf{X}^{\top}\mathbf{X},
$$

so \(L=\frac{2}{n}\lambda_{\max}(\mathbf{X}^{\top}\mathbf{X})\) and the safe range is \(\eta<\dfrac{n}{\lambda_{\max}(\mathbf{X}^{\top}\mathbf{X})}\).

Hessian derivation, since we used it: start from \(\partial J/\partial\theta_j=\frac{2}{n}\sum_i r_i X_{ij}\) with \(r_i=\sum_k X_{ik}\theta_k-y_i\). Differentiate again:

$$
\frac{\partial^{2}J}{\partial\theta_{\ell}\,\partial\theta_j}=\frac{2}{n}\sum_{i=1}^{n}X_{i\ell}X_{ij}=\frac{2}{n}(\mathbf{X}^{\top}\mathbf{X})_{j\ell}.
$$

### 10.5 Intuition

Look downhill, take a step, repeat. Too timid (\(\eta\) tiny): you will get there eventually but students will fall asleep. Too bold (\(\eta\) huge): you leap over the valley and climb the opposite wall.

### 10.6 Worked example

**A. Two-parameter bowl.** \(f(\theta_1,\theta_2)=\theta_1^{2}+\theta_1\theta_2+\theta_2^{2}\), start at \((1,2)\), \(\eta=0.1\).

$$
\nabla f(1,2)=\begin{pmatrix}4\\5\end{pmatrix},\qquad
\begin{pmatrix}\theta_1\\\theta_2\end{pmatrix}\leftarrow\begin{pmatrix}1\\2\end{pmatrix}-0.1\begin{pmatrix}4\\5\end{pmatrix}=\begin{pmatrix}0.6\\1.5\end{pmatrix}.
$$

$$
f(1,2)=7,\qquad f(0.6,1.5)=0.36+0.90+2.25=3.51.
$$

Loss decreased.

**B. MSE, one parameter.** From Section 6, \(J'(\theta)=5\theta-13\), \(\theta^{(0)}=2\), \(\eta=0.1\):

$$
\theta^{(1)}=2-0.1\cdot(-3)=2.3.
$$

$$
J(2.3)=\frac12\bigl[(2.3-3)^{2}+(4.6-5)^{2}\bigr]=\frac12(0.49+0.16)=0.325,
$$

which is less than \(J(2)=1\). The exact minimizer is \(5\theta-13=0\Rightarrow\theta=\frac{13}{5}=2.6\), where \(J=0.1\). One step moved \(2\to 2.3\), toward the minimum.

**C. \(\eta\) too large.** Same \(J\), \(\eta=1\):

$$
\theta\leftarrow 2-1\cdot(-3)=5,\qquad J(5)=\frac12\bigl[(5-3)^{2}+(10-5)^{2}\bigr]=\frac12(4+25)=14.5>1.
$$

The step left the region where the linear approximation holds. For this \(J\), \(J''(\theta)=5\), so \(L=5\) and the smoothness bound says \(\eta<2/5=0.4\). Our \(\eta=0.1\) is inside; \(\eta=1\) is not.

### 10.7 Connection to ML

This **is** the training loop for almost every neural network:

1. Forward: \(\hat{\mathbf y}=f_{\boldsymbol{\theta}}(\mathbf{X})\).
2. Loss: \(J(\boldsymbol{\theta})\).
3. Backward: \(\nabla J(\boldsymbol{\theta})\).
4. Update: \(\boldsymbol{\theta}\leftarrow\boldsymbol{\theta}-\eta\nabla J(\boldsymbol{\theta})\) (or Adam, which is a decorated version of the same idea).

The existing double-descent module **does not run GD**. It solves the minimization in closed form (Section 15). Pedagogically that is a feature: students can later compare “one-shot linear algebra” with “many small GD steps” on the same \(J\), and they should agree (up to step-size / iteration error) when \(J\) is this convex quadratic.

---

## 11. Optimization

### 11.1 Definition

**Optimization** is the problem

$$
\min_{\boldsymbol{\theta}\in\mathbb{R}^{p}}J(\boldsymbol{\theta}),
$$

possibly with constraints. A point \(\boldsymbol{\theta}^{\star}\) is a **global minimizer** if \(J(\boldsymbol{\theta}^{\star})\le J(\boldsymbol{\theta})\) for every \(\boldsymbol{\theta}\). It is a **local minimizer** if that inequality holds in some neighborhood.

A **critical point** satisfies \(\nabla J(\boldsymbol{\theta})=\mathbf{0}\) (or fails to exist). For a differentiable function, every interior local minimizer is critical. The converse is false: critical points can be maxima or saddles.

A function is **convex** if for all \(\boldsymbol{\theta},\boldsymbol{\psi}\) and \(\gamma\in[0,1]\),

$$
J\bigl(\gamma\boldsymbol{\theta}+(1-\gamma)\boldsymbol{\psi}\bigr)\le \gamma\,J(\boldsymbol{\theta})+(1-\gamma)J(\boldsymbol{\psi}).
$$

**[CORRECTED 2026-08-28]** This statement previously used \(\lambda\) for the interpolation coefficient and \(\boldsymbol{\phi}\) for the second parameter vector. Both collided with reserved symbols (\(\lambda\) = ridge coefficient / eigenvalue; \(\phi\) = the feature map of §4.2), so they are now \(\gamma\) and \(\boldsymbol{\psi}\). \(t\) was not used here because it is reserved for the gradient-descent iteration index.

For a differentiable convex function, every critical point is a global minimizer. MSE in \(\boldsymbol{\theta}\) for a model that is linear in \(\boldsymbol{\theta}\) is convex, because its Hessian \(\frac{2}{n}\mathbf{X}^{\top}\mathbf{X}\) is positive semidefinite (\(\mathbf{v}^{\top}\mathbf{X}^{\top}\mathbf{X}\mathbf{v}=\lVert\mathbf{X}\mathbf{v}\rVert_{2}^{2}\ge 0\)). Neural nets are in general **not** convex.

### 11.2 Notation

- \(\boldsymbol{\theta}^{\star}\in\arg\min_{\boldsymbol{\theta}}J(\boldsymbol{\theta})\) for a minimizer (the set of minimizers may have many points).
- We say “a” minimizer, not “the” minimizer, when \(\mathbf{X}\) does not have full column rank.

### 11.3 Formula

First-order necessary condition (unconstrained, differentiable):

$$
\nabla J(\boldsymbol{\theta}^{\star})=\mathbf{0}.
$$

For MSE this is

$$
\frac{2}{n}\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}^{\star}-\mathbf{y})=\mathbf{0}\iff\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}^{\star}=\mathbf{X}^{\top}\mathbf{y},
$$

which is the **normal equation** (Section 15). The factor \(2/n\) cancelled; averaging vs not averaging does not change the minimizer.

Gradient descent is one **algorithm** for this problem. Solving the normal equations is another. They are not different goals.

### 11.4 Derivation (critical point of MSE)

Set the gradient from Section 8 to zero:

$$
\frac{2}{n}\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}-\mathbf{y})=\mathbf{0}.
$$

Multiply through by \(n/2\) (positive, so equivalent):

$$
\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}-\mathbf{X}^{\top}\mathbf{y}=\mathbf{0}.
$$

Rearrange:

$$
\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}.
$$

If \(\mathbf{X}^{\top}\mathbf{X}\) is invertible (equivalently: the columns of \(\mathbf{X}\) are linearly independent, which requires \(p\le n\)), there is a unique solution

$$
\boldsymbol{\theta}^{\star}=(\mathbf{X}^{\top}\mathbf{X})^{-1}\mathbf{X}^{\top}\mathbf{y}.
$$

If \(p>n\), \(\mathbf{X}^{\top}\mathbf{X}\) cannot be invertible (\(n\times p\) matrix cannot have \(p>n\) independent columns). Then infinitely many \(\boldsymbol{\theta}\) interpolate, and we need an extra rule: minimum \(\lVert\boldsymbol{\theta}\rVert_2\). That is the existing engine’s overparameterized path (Section 15.4).

### 11.5 Intuition

Optimization names the *question*: “which \(\boldsymbol{\theta}\) makes \(J\) smallest?” Calculus gives a *test* (gradient zero). Linear algebra, for this particular \(J\), gives a *formula*. Gradient descent gives a *procedure* that still works when there is no formula (deep nets).

### 11.6 Worked example

Same one-parameter MSE. Critical point: \(5\theta-13=0\Rightarrow\theta^{\star}=13/5=2.6\).

Normal-equation check: \(\mathbf{X}^{\top}\mathbf{X}=1^{2}+2^{2}=5\), \(\mathbf{X}^{\top}\mathbf{y}=1\cdot 3+2\cdot 5=13\), so \(5\theta=13\), same \(\theta^{\star}\). \(J(\theta^{\star})=0.1\), and we already saw \(J(2)=1>0.1\).

### 11.7 Connection to ML

Every training run is an optimization problem. The existing site’s `minNormLeastSquares` **is** the optimizer. A GD lesson would replace that one call with a loop of updates, minimizing the same \(J\) the error chart already plots.

---

## 12. Vectors

### 12.1 Definition

A **vector** in \(\mathbb{R}^{p}\) is an ordered list of \(p\) real numbers, written as a column

$$
\mathbf{v}=\begin{pmatrix}v_1\\ \vdots\\ v_p\end{pmatrix}.
$$

Addition and scalar multiplication are entrywise. The **dot product** (inner product) is

$$
\mathbf{u}^{\top}\mathbf{v}=\sum_{j=1}^{p}u_j v_j.
$$

The **Euclidean norm** is \(\lVert\mathbf{v}\rVert_2=\sqrt{\mathbf{v}^{\top}\mathbf{v}}\). Two vectors are **orthogonal** when their dot product is \(0\).

### 12.2 Notation

Column vectors. \(\mathbf{0}\) is the zero vector. We never write \(\vec{v}\) on this site.

### 12.3 Formula

$$
\mathbf{u}+\mathbf{v}=\begin{pmatrix}u_1+v_1\\ \vdots\\ u_p+v_p\end{pmatrix},\qquad
c\mathbf{v}=\begin{pmatrix}cv_1\\ \vdots\\ cv_p\end{pmatrix},\qquad
\mathbf{u}^{\top}\mathbf{v}=\sum_{j=1}^{p}u_j v_j.
$$

### 12.4 Derivation

These are definitions. The one identity we use constantly:

$$
\lVert\mathbf{u}-\mathbf{v}\rVert_{2}^{2}=(\mathbf{u}-\mathbf{v})^{\top}(\mathbf{u}-\mathbf{v})=\lVert\mathbf{u}\rVert_{2}^{2}-2\mathbf{u}^{\top}\mathbf{v}+\lVert\mathbf{v}\rVert_{2}^{2}.
$$

### 12.5 Intuition

A vector is both a list of knobs (\(\boldsymbol{\theta}\)) and an arrow in parameter space (the gradient). The dot product \(\nabla J^{\top}\boldsymbol{\Delta}\) is “how much the first-order loss changes if we move by \(\boldsymbol{\Delta}\).”

### 12.6 Worked example

\(\mathbf{a}=\begin{pmatrix}1\\2\end{pmatrix}\), \(\mathbf{b}=\begin{pmatrix}3\\4\end{pmatrix}\).

$$
\mathbf{a}^{\top}\mathbf{b}=1\cdot 3+2\cdot 4=11,\qquad \lVert\mathbf{a}\rVert_2=\sqrt{1+4}=\sqrt{5}.
$$

### 12.7 Connection to ML

Parameters, gradients, residuals, and predictions are all vectors. The existing `vectorNorm` in `linalg.ts` is \(\lVert\boldsymbol{\theta}\rVert_2\), used to talk about min-norm solutions.

---

## 13. Matrices and matrix–vector products

### 13.1 Definition

A **matrix** \(\mathbf{A}\in\mathbb{R}^{n\times p}\) is a rectangular grid of numbers with \(n\) rows and \(p\) columns. Entry \(\mathbf{A}_{ij}\) sits in row \(i\), column \(j\).

The **matrix–vector product** \(\mathbf{A}\mathbf{v}\), for \(\mathbf{v}\in\mathbb{R}^{p}\), is the vector in \(\mathbb{R}^{n}\) whose \(i\)-th entry is the dot product of row \(i\) of \(\mathbf{A}\) with \(\mathbf{v}\):

$$
(\mathbf{A}\mathbf{v})_i=\sum_{j=1}^{p}A_{ij}v_j.
$$

Equivalently, \(\mathbf{A}\mathbf{v}\) is the linear combination of the **columns** of \(\mathbf{A}\) with weights \(v_j\).

**Matrix–matrix product** \(\mathbf{A}\mathbf{B}\), when the inner dimensions match: column \(j\) of \(\mathbf{A}\mathbf{B}\) is \(\mathbf{A}\) times column \(j\) of \(\mathbf{B}\).

### 13.2 Notation

\(\mathbf{X}\) is always \(n\times p\) (samples \(\times\) features) on this site. That matches `X.length === n` and `X[0].length === p` in `linalg.ts`.

### 13.3 Formula

$$
\hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta},\qquad
(\mathbf{X}\boldsymbol{\theta})_i=\sum_{j=1}^{p}X_{ij}\theta_j={\mathbf x}^{(i)\top}\boldsymbol{\theta}.
$$

### 13.4 Derivation

By definition of \(\hat y_i={\mathbf x}^{(i)\top}\boldsymbol{\theta}\) and of matrix–vector multiplication, stacking those \(n\) scalars *is* \(\mathbf{X}\boldsymbol{\theta}\).

### 13.5 Intuition

Multiplying by \(\mathbf{X}\) is “run the linear model on every training sample at once.” You do not loop in the math; the matrix product *is* the loop.

### 13.6 Worked example

$$
\mathbf{X}=\begin{pmatrix}1&2\\3&4\\5&6\end{pmatrix},\qquad
\boldsymbol{\theta}=\begin{pmatrix}1\\-1\end{pmatrix},\qquad
\mathbf{X}\boldsymbol{\theta}=\begin{pmatrix}1-2\\3-4\\5-6\end{pmatrix}=\begin{pmatrix}-1\\-1\\-1\end{pmatrix}.
$$

Column view: \(\mathbf{X}\boldsymbol{\theta}=1\cdot\begin{pmatrix}1\\3\\5\end{pmatrix}+(-1)\cdot\begin{pmatrix}2\\4\\6\end{pmatrix}\).

### 13.7 Connection to ML

The forward pass of linear (and polynomial) regression is one matrix–vector product. `matVec` in `linalg.ts` implements it. Mini-batch training in a neural net is the same idea with a batch matrix.

---

## 14. Transpose

### 14.1 Definition

The **transpose** \(\mathbf{A}^{\top}\) is the matrix obtained by flipping \(\mathbf{A}\) over its diagonal: \((\mathbf{A}^{\top})_{ji}=A_{ij}\). Rows become columns. If \(\mathbf{A}\) is \(n\times p\), then \(\mathbf{A}^{\top}\) is \(p\times n\).

For a column vector, \(\mathbf{v}^{\top}\) is the corresponding row. The identity \(\mathbf{u}^{\top}\mathbf{v}=\mathbf{v}^{\top}\mathbf{u}\) is the dot product written two ways.

### 14.2 Notation

\(\mathbf{A}^{\top}\). Not \(A'\), not \(A^T\) in sans-serif if we can help it; in LaTeX always `\mathbf{A}^{\top}`.

### 14.3 Formula

$$
(\mathbf{A}^{\top})_{ji}=A_{ij},\qquad (\mathbf{A}\mathbf{B})^{\top}=\mathbf{B}^{\top}\mathbf{A}^{\top},\qquad (\mathbf{A}\mathbf{v})^{\top}=\mathbf{v}^{\top}\mathbf{A}^{\top}.
$$

The inner-product identity used constantly in least squares:

$$
(\mathbf{X}\boldsymbol{\theta})^{\top}\mathbf{y}=\boldsymbol{\theta}^{\top}(\mathbf{X}^{\top}\mathbf{y}).
$$

### 14.4 Derivation of \((\mathbf{AB})^{\top}=\mathbf{B}^{\top}\mathbf{A}^{\top}\)

Entry \((j,i)\) of \((\mathbf{AB})^{\top}\) is entry \((i,j)\) of \(\mathbf{AB}\), which is row \(i\) of \(\mathbf{A}\) dotted with column \(j\) of \(\mathbf{B}\). That is the same number as row \(j\) of \(\mathbf{B}^{\top}\) dotted with column \(i\) of \(\mathbf{A}^{\top}\), which is entry \((j,i)\) of \(\mathbf{B}^{\top}\mathbf{A}^{\top}\).

### 14.5 Intuition

Transpose is how you turn “a number for each sample” into “a number for each parameter.” The residual \(\mathbf{r}\in\mathbb{R}^{n}\) lives in sample space. The gradient lives in parameter space \(\mathbb{R}^{p}\). The map \(\mathbf{r}\mapsto\mathbf{X}^{\top}\mathbf{r}\) is that translation: it asks each feature column how it correlates with the residual.

### 14.6 Worked example

$$
\mathbf{X}=\begin{pmatrix}1&2\\3&4\\5&6\end{pmatrix},\qquad
\mathbf{X}^{\top}=\begin{pmatrix}1&3&5\\2&4&6\end{pmatrix},\qquad
\mathbf{y}=\begin{pmatrix}1\\0\\1\end{pmatrix},
$$

$$
\mathbf{X}^{\top}\mathbf{y}=\begin{pmatrix}1+0+5\\2+0+6\end{pmatrix}=\begin{pmatrix}6\\8\end{pmatrix}.
$$

### 14.7 Connection to ML

Every least-squares gradient contains an \(\mathbf{X}^{\top}\). Backprop through a linear layer \(\hat{\mathbf y}=\mathbf{X}\boldsymbol{\theta}\) is exactly multiplication by \(\mathbf{X}^{\top}\). The engine’s `transpose` helper is this operation.

---

## 15. Normal equations for least squares

### 15.1 Definition

The **ordinary least squares (OLS)** problem is

$$
\min_{\boldsymbol{\theta}\in\mathbb{R}^{p}}\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}
$$

(equivalently, minimize \(J(\boldsymbol{\theta})\); the factor \(1/n\) does not matter). The **normal equations** are the linear system you get by setting the gradient to zero:

$$
\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}.
$$

They are “normal” because the residual \(\mathbf{r}=\mathbf{X}\boldsymbol{\theta}^{\star}-\mathbf{y}\) is orthogonal (normal) to the column space of \(\mathbf{X}\): \(\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}^{\star}-\mathbf{y})=\mathbf{0}\). **[CORRECTED 2026-08-28]** — this line previously wrote \(\mathbf{y}-\mathbf{X}\boldsymbol{\theta}^{\star}\), violating the residual convention declared in §2.2 (\(\mathbf{r}=\) prediction minus target). Orthogonality is sign-invariant, so no number changes; only the expression does.

### 15.2 Notation

- \(\boldsymbol{\theta}_{\mathrm{LS}}\) or \(\boldsymbol{\theta}^{\star}\) for an OLS solution.
- Gram matrix \(\mathbf{G}=\mathbf{X}^{\top}\mathbf{X}\in\mathbb{R}^{p\times p}\) when \(p\le n\).
- Dual Gram \(\mathbf{K}=\mathbf{X}\mathbf{X}^{\top}\in\mathbb{R}^{n\times n}\) when \(p>n\).

### 15.3 Formula

**Overdetermined / tall case** (\(p\le n\), columns independent) — **[CORRECTED 2026-08-28]**, this heading previously said “Underdetermined,” which is backwards: a tall \(n\times p\) matrix with \(p\le n\) gives *more equations than unknowns*, i.e. the **overdetermined** case. The formula below was and is correct:

$$
\boldsymbol{\theta}^{\star}=(\mathbf{X}^{\top}\mathbf{X})^{-1}\mathbf{X}^{\top}\mathbf{y}.
$$

**Ridge (what the engine actually runs, \(p\le n\)):**

$$
\boldsymbol{\theta}_{\lambda}=(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)^{-1}\mathbf{X}^{\top}\mathbf{y}.
$$

**Min-norm interpolator** (\(p>n\), rows independent, \(\lambda=0\)):

$$
\boldsymbol{\theta}_{\mathrm{mn}}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top})^{-1}\mathbf{y}.
$$

**Ridge, dual form (engine, \(p>n\)):**

$$
\boldsymbol{\theta}_{\lambda}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n)^{-1}\mathbf{y}.
$$

When \(\lambda>0\), the primal and dual ridge formulas are the **same** vector (push-through identity, derived below). When \(\lambda=0\) and \(p>n\), only the dual (or a pseudoinverse) is defined.

### 15.4 Derivations (no skipped algebra)

#### A. Normal equations from the gradient

Already done in Section 11.4. Restated: \(\nabla J=\frac{2}{n}\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}-\mathbf{y})=\mathbf{0}\) iff \(\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}\).

#### B. Residual is orthogonal to the columns of \(\mathbf{X}\)

Rewrite \(\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}^{\star}-\mathbf{y})=\mathbf{0}\) as \(\mathbf{X}^{\top}\mathbf{r}=\mathbf{0}\) with \(\mathbf{r}=\mathbf{X}\boldsymbol{\theta}^{\star}-\mathbf{y}\). Each entry of that vector is “column \(j\) of \(\mathbf{X}\), dotted with \(\mathbf{r}\).” So \(\mathbf{r}\) is orthogonal to every column, hence to the whole column space.

#### C. Ridge from a regularized objective

Minimize \(\Psi(\boldsymbol{\theta})=\lVert\mathbf{X}\boldsymbol{\theta}-\mathbf{y}\rVert_{2}^{2}+\lambda\lVert\boldsymbol{\theta}\rVert_{2}^{2}\) with \(\lambda>0\). Then

$$
\nabla\Psi=2\mathbf{X}^{\top}(\mathbf{X}\boldsymbol{\theta}-\mathbf{y})+2\lambda\boldsymbol{\theta}.
$$

Set to zero and divide by 2:

$$
\mathbf{X}^{\top}\mathbf{X}\,\boldsymbol{\theta}+\lambda\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}\iff(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}.
$$

This is `linalg.ts` for \(p\le n\).

#### D. Min-norm interpolator (\(\lambda=0\), \(p>n\))

Assume \(\mathbf{X}\) has full row rank \(n\), so there exist interpolators: \(\mathbf{X}\boldsymbol{\theta}=\mathbf{y}\) has solutions. Among them, take the one with smallest \(\lVert\boldsymbol{\theta}\rVert_2\).

Any \(\boldsymbol{\theta}\) can be split into a part in the row space of \(\mathbf{X}\) (equivalently, in the column space of \(\mathbf{X}^{\top}\)) plus a part in the nullspace of \(\mathbf{X}\). The nullspace part does not change \(\mathbf{X}\boldsymbol{\theta}\) but increases the Euclidean norm (Pythagoras: the two parts are orthogonal). So the min-norm interpolator must lie in the row space:

$$
\boldsymbol{\theta}=\mathbf{X}^{\top}\boldsymbol{\alpha}\qquad\text{for some }\boldsymbol{\alpha}\in\mathbb{R}^{n}.
$$

Impose interpolation:

$$
\mathbf{X}\boldsymbol{\theta}=\mathbf{X}\mathbf{X}^{\top}\boldsymbol{\alpha}=\mathbf{y}.
$$

Full row rank \(\Rightarrow\) \(\mathbf{X}\mathbf{X}^{\top}\) is \(n\times n\) and invertible, so \(\boldsymbol{\alpha}=(\mathbf{X}\mathbf{X}^{\top})^{-1}\mathbf{y}\) and

$$
\boldsymbol{\theta}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top})^{-1}\mathbf{y}.
$$

This is the \(\lambda=0\) limit of the engine’s dual path.

Optional Lagrange view of the same fact (not required for students): minimize \(\frac12\lVert\boldsymbol{\theta}\rVert_{2}^{2}\) subject to \(\mathbf{X}\boldsymbol{\theta}=\mathbf{y}\). Stationarity in \(\boldsymbol{\theta}\) gives \(\boldsymbol{\theta}=\mathbf{X}^{\top}\boldsymbol{\alpha}\); the constraint recovers the same \(\boldsymbol{\alpha}\).

#### E. Push-through identity (primal ridge = dual ridge when \(\lambda>0\))

**Claim.** For any \(\mathbf{X}\in\mathbb{R}^{n\times p}\) and \(\lambda>0\),

$$
(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)^{-1}\mathbf{X}^{\top}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n)^{-1}.
$$

**Proof.** Both sides are \(p\times n\). Multiply the claimed equality on the left by the invertible matrix \((\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)\). It is enough to check

$$
\mathbf{X}^{\top}=(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)\,\mathbf{X}^{\top}\,(\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n)^{-1}.
$$

The right-hand side without the inverse is

$$
(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)\mathbf{X}^{\top}=\mathbf{X}^{\top}\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{X}^{\top}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n).
$$

Multiplying on the right by \((\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n)^{-1}\) therefore yields exactly \(\mathbf{X}^{\top}\). So the claim holds, and

$$
(\mathbf{X}^{\top}\mathbf{X}+\lambda\mathbf{I}_p)^{-1}\mathbf{X}^{\top}\mathbf{y}=\mathbf{X}^{\top}(\mathbf{X}\mathbf{X}^{\top}+\lambda\mathbf{I}_n)^{-1}\mathbf{y}.
$$

The engine uses the left form when \(p\le n\) (solve a \(p\times p\) system) and the right form when \(p>n\) (solve an \(n\times n\) system). Same \(\boldsymbol{\theta}\) in exact arithmetic.

This identity was also checked numerically on a \(3\times 2\) example with \(\lambda=0.5\); primal and dual coefficients agreed to \(10^{-10}\).

### 15.5 Intuition

OLS asks the prediction \(\mathbf{X}\boldsymbol{\theta}\) to be the point in the column space of \(\mathbf{X}\) nearest \(\mathbf{y}\). The error leftover must be perpendicular to that subspace — that is the normal equation. When there are more knobs than samples, many \(\boldsymbol{\theta}\) hit \(\mathbf{y}\) exactly; the min-norm choice is the one that stays as close to the origin as possible in parameter space, which (for many bases) is the “simplest” interpolator.

### 15.6 Worked example (three points, intercept plus slope)

Data: \((x,y)=(1,1),\ (2,2),\ (3,2)\). Model \(\hat y=\theta_1+\theta_2 x\). Then \(n=3\), \(p=2\),

$$
\mathbf{X}=\begin{pmatrix}1&1\\1&2\\1&3\end{pmatrix},\qquad
\mathbf{y}=\begin{pmatrix}1\\2\\2\end{pmatrix}.
$$

$$
\mathbf{X}^{\top}\mathbf{X}=\begin{pmatrix}3&6\\6&14\end{pmatrix},\qquad
\mathbf{X}^{\top}\mathbf{y}=\begin{pmatrix}5\\11\end{pmatrix}.
$$

(Check: \(1+1+1=3\), \(1+2+3=6\), \(1+4+9=14\); \(1+2+2=5\), \(1\cdot 1+2\cdot 2+3\cdot 2=11\).)

Solve

$$
\begin{aligned}
3\theta_1+6\theta_2&=5,\\
6\theta_1+14\theta_2&=11.
\end{aligned}
$$

Divide the first equation by 3: \(\theta_1+2\theta_2=\frac53\), so \(\theta_1=\frac53-2\theta_2\). Substitute:

$$
6\Bigl(\frac53-2\theta_2\Bigr)+14\theta_2=11\iff 10-12\theta_2+14\theta_2=11\iff 10+2\theta_2=11\iff\theta_2=\frac12.
$$

$$
\theta_1=\frac53-2\cdot\frac12=\frac53-1=\frac23.
$$

Predictions: \(\frac23+\frac12=\frac76\), \(\frac23+1=\frac53\), \(\frac23+\frac32=\frac{13}{6}\).

Residuals, in this document’s convention \(r_i=\hat y_i-y_i\) (**prediction minus target**, §2.2):

$$
r_1=\frac76-1=\frac16,\qquad r_2=\frac53-2=-\frac13,\qquad r_3=\frac{13}{6}-2=\frac16.
$$

**[CORRECTED 2026-08-28]** — these were previously written \(1-\frac76=-\frac16\), \(2-\frac53=\frac13\), \(2-\frac{13}{6}=-\frac16\), i.e. \(y-\hat y\), the opposite of the convention declared in §2.2. SSE, MSE and the orthogonality check below are all sign-invariant, so **no numeric result changes** — only the signs and the expressions.

SSE \(=\bigl(\frac16\bigr)^{2}+\bigl(-\frac13\bigr)^{2}+\bigl(\frac16\bigr)^{2}=\frac{1+4+1}{36}=\frac16\).

MSE \(J=\frac{1}{3}\cdot\frac16=\frac{1}{18}\).

Orthogonality check: \(\mathbf{X}^{\top}\mathbf{r}\) should be \(\mathbf{0}\).

$$
\sum_i r_i= \frac16-\frac13+\frac16=0,
$$

$$
\sum_i x_i r_i=1\cdot\tfrac16+2\cdot\bigl(-\tfrac13\bigr)+3\cdot\tfrac16=\tfrac16-\tfrac46+\tfrac36=0.
$$

Plug \(\boldsymbol{\theta}\) back into the normal equations: \(3\cdot\frac23+6\cdot\frac12=2+3=5\), \(6\cdot\frac23+14\cdot\frac12=4+7=11\). Matches \(\mathbf{X}^{\top}\mathbf{y}\).

### 15.7 Connection to ML

This is the entire fit of the current site: `fitPolynomial` builds \(\mathbf{X}\) from Chebyshev features and `minNormLeastSquares` applies the primal or dual ridge formula. A student who understands this section understands what the experiment is actually computing at each degree.

In a neural-net training loop, we almost never form \(\mathbf{X}^{\top}\mathbf{X}\); we use GD instead. The *objective* is still “make a loss small.” Linear regression is the rare case where the critical-point equation is a linear system we can solve directly.

---

## 16. Conditioning, ill-conditioning, and why high-degree polynomial fits blow up

### 16.1 Definition

For an invertible square matrix \(\mathbf{A}\), the **2-norm condition number** is

$$
\kappa_2(\mathbf{A})=\lVert\mathbf{A}\rVert_2\,\lVert\mathbf{A}^{-1}\rVert_2=\frac{\sigma_{\max}(\mathbf{A})}{\sigma_{\min}(\mathbf{A})}.
$$

Always \(\kappa_2(\mathbf{A})\ge 1\). For a non-square \(\mathbf{X}\), one uses singular values of \(\mathbf{X}\) itself:

$$
\kappa_2(\mathbf{X})=\frac{\sigma_{\max}(\mathbf{X})}{\sigma_{\min}(\mathbf{X})},
$$

where \(\sigma_{\min}\) is the smallest *positive* singular value if we are talking about a pseudoinverse, and \(+\infty\) if \(\mathbf{X}\) is rank-deficient and we insist on a true inverse.

A problem is **ill-conditioned** when \(\kappa\) is huge: small relative changes in the data can cause large relative changes in the computed answer. This is a property of the *problem*, not (only) of the algorithm. A stable algorithm still cannot recover digits that the condition number has already destroyed.

The \(\infty\)-norm versions, which students can compute by hand, are

$$
\lVert\mathbf{A}\rVert_{\infty}=\max_i\sum_j|A_{ij}|\qquad\text{(max absolute row sum)},
$$

$$
\kappa_{\infty}(\mathbf{A})=\lVert\mathbf{A}\rVert_{\infty}\,\lVert\mathbf{A}^{-1}\rVert_{\infty}.
$$

They are not equal to \(\kappa_2\), but they tell the same qualitative story.

### 16.2 Notation

- \(\kappa(\mathbf{A})\) means \(\kappa_2\) unless a subscript is written.
- Machine epsilon for float64 is \(u=2^{-52}\approx 2.22\times 10^{-16}\). A rough (not theorem-sharp) slogan: you may lose about \(\log_{10}\kappa\) decimal digits.

### 16.3 Formula

Perturbation slogan (invertible \(\mathbf{A}\mathbf{z}=\mathbf{b}\)): if \(\mathbf{b}\) is perturbed to \(\mathbf{b}+\Delta\mathbf{b}\) and \(\mathbf{z}\) to \(\mathbf{z}+\Delta\mathbf{z}\), then

$$
\frac{\lVert\Delta\mathbf{z}\rVert}{\lVert\mathbf{z}\rVert}\le\kappa(\mathbf{A})\,\frac{\lVert\Delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert}
$$

in the matching norm, for the exact (not rounded) perturbed system. Rounding error in forming \(\mathbf{A}\) and \(\mathbf{b}\) plays the role of a perturbation.

**Normal equations square the condition number.** If \(\mathbf{X}\) has full column rank,

$$
\kappa_2(\mathbf{X}^{\top}\mathbf{X})=\kappa_2(\mathbf{X})^{2},
$$

because the singular values of \(\mathbf{X}^{\top}\mathbf{X}\) are the squares of those of \(\mathbf{X}\). Solving \((\mathbf{X}^{\top}\mathbf{X})\boldsymbol{\theta}=\mathbf{X}^{\top}\mathbf{y}\) is therefore strictly worse-conditioned than solving the least-squares problem from a QR or SVD of \(\mathbf{X}\) itself. The engine’s dual path uses \(\mathbf{X}\mathbf{X}^{\top}\), which has the same nonzero eigenvalues as \(\mathbf{X}^{\top}\mathbf{X}\) and the same squaring problem.

### 16.4 Why monomial bases explode

A **Vandermonde** design matrix for scalar inputs \(x_1,\ldots,x_n\) and degree \(d\) uses columns \(1,x,x^{2},\ldots,x^{d}\):

$$
V_{ik}=x_i^{k-1},\qquad i=1,\ldots,n,\quad k=1,\ldots,d+1.
$$

On a bounded interval, these columns become nearly linearly dependent as \(d\) grows: \(x^{d}\) and \(x^{d+1}\) look alike (especially if the \(x_i\) cluster), and high powers collapse toward \(0\) on \((-1,1)\). The matrix is classically ill-conditioned.

It is a standard theorem that for real nodes on \([-1,1]\), \(\kappa_2(V)\) grows **at least exponentially** in the degree (Beckermann, *Numer. Math.* 2000; Pan, *SIAM J. Matrix Anal. Appl.* 2016).

**[CORRECTED 2026-08-28] — measurement replaces the secondhand constant.** This section previously quoted a specific exponential prefactor from secondary discussion. That citation is removed. In its place, here is what was actually **measured on this repo**, using this repo’s arcsine nodes and a monomial design matrix:

| degree \(d\) | measured \(\kappa(\mathbf{X})\), monomial basis, arcsine nodes |
| --- | --- |
| 5 | \(4.6\times10^{1}\) |
| 10 | \(3.7\times10^{3}\) |
| 15 | \(3.0\times10^{5}\) |
| 20 | \(3.1\times10^{7}\) |

That is a clean exponential: \(\log_{10}\kappa\) rises by \(0.389\) per degree, i.e. a factor of \(10^{0.389}\approx 2.45\) per degree. This **matches \((1+\sqrt2)=2.414\) to measurement accuracy** — so the classical growth rate is reproduced here as an observation on our own data rather than asserted from a constant we could not check against a primary theorem statement. Use the measurement, not the citation, when writing lesson copy.

Consequence for OLS: even if you could store \(\boldsymbol{\theta}\) exactly, mapping targets to **monomial** coefficients is an exponentially sensitive map. Computed coefficients become enormous and wildly wrong; evaluating the polynomial can still sometimes look acceptable (backward error versus forward error — Shen & Serkh, *SIAM J. Numer. Anal.* 2023). For an education site that *plots* the fitted curve and reports MSE, huge wrong coefficients plus evaluation outside the sample set produce the “blow up” students see.

### 16.5 Why this site uses Chebyshev + arcsine

Chebyshev polynomials of the first kind,

$$
T_0(x)=1,\quad T_1(x)=x,\quad T_{k+1}(x)=2x\,T_k(x)-T_{k-1}(x),
$$

are orthogonal on \([-1,1]\) with weight \(w(x)=(1-x^{2})^{-1/2}\):

$$
\int_{-1}^{1}T_j(x)T_k(x)\frac{\mathrm{d}x}{\sqrt{1-x^{2}}}=
\begin{cases}
0 & j\neq k,\\
\pi & j=k=0,\\
\pi/2 & j=k\ge 1.
\end{cases}
$$

(ProofWiki / any orthogonal-polynomials textbook; equivalently \(T_k(\cos\theta)=\cos(k\theta)\).)

The **arcsine** (Chebyshev) probability density on \([-1,1]\) is the normalized version of that weight:

$$
\rho(x)=\frac{1}{\pi\sqrt{1-x^{2}}}.
$$

Sampling \(x=\cos(\pi U)\) with \(U\sim\mathrm{Uniform}(0,1)\) produces exactly this law: \(x=\cos(\pi U)\) implies \(\bigl|\mathrm{d}U/\mathrm{d}x\bigr|=1/(\pi\sqrt{1-x^{2}})\). That is `sampleInput` in `dataset.ts`.

If rows of \(\mathbf{X}\) are drawn from \(\rho\), the Gram \(\frac1n\mathbf{X}^{\top}\mathbf{X}\) concentrates around a **diagonal** matrix of the integrals above. Approximately orthogonal columns \(\Rightarrow\) \(\kappa(\mathbf{X})\) stays tame for moderate \(d\). That is the correct reason the README claims a Chebyshev basis with arcsine inputs is more stable than monomials with uniform \(x\).

Limits of the argument (honest):

- The samples are random, not exact Chebyshev nodes, so orthogonality is approximate.
- Once \(p>n\), the \(n\times p\) matrix **cannot** have orthogonal columns (too many columns). The dual matrix \(\mathbf{K}=\mathbf{X}\mathbf{X}^{\top}\) can still be ill-conditioned.
- Forming Gram matrices still squares \(\kappa\).
- **[CORRECTED 2026-08-28]** The engine’s ridge is no longer the absolute \(\lambda=10^{-10}\) this section used to describe. It is `RIDGE = 1e-8` **multiplied by the mean diagonal of the Gram matrix** (`src/lib/linalg.ts:19, 45-50`) — a relative, dimensionless ridge. With that ridge, the high-degree blow-up on the old defaults peaks at test MSE \(6.1\times10^{4}\), **not** the \(\sim10^{6}\) previously recorded from Phase 0. One and a half orders of magnitude smaller, and still a numerical explosion rather than a second descent.

#### 16.5a **[VERIFIED 2026-08-28]** What conditioning actually does on this repo, and what the relative ridge does about it

The earlier framing of this section — “Chebyshev + arcsine keeps \(\kappa\) tame for moderate \(d\), then it grows” — was directionally right but named the wrong driver. Measured:

- **\(\kappa\) for Chebyshev + arcsine is essentially flat**, between roughly **1.5 and 3**, all the way up to \(d\approx 20\). There is no exponential regime there at all. Contrast the monomial table in §16.4, which is already at \(3.1\times10^{7}\) by \(d=20\).
- Past that, \(\kappa\) **accelerates far faster than any fixed exponential**. The driver is **\(p\to n\)** — the design matrix becoming square on random nodes — **not the basis**. Attributing the late blow-up to “high-degree polynomials being ill-conditioned” is the wrong lesson; the right lesson is that you are running out of samples.
- Beyond \(d\approx 78\), the smallest Gram eigenvalue **computes as \(\approx -10^{-15}\)**: negative, i.e. below the float64 resolution of \(\lambda_{\max}\approx 188\). Condition numbers printed in that regime are **not meaningful digits** and must never be quoted to a student as measurements.
- The relative ridge **floors** the condition number at
  $$
  \kappa \;\approx\; \frac{\lambda_{\max}}{\texttt{RIDGE}\cdot\overline{\mathrm{diag}}}\;\approx\;4.6\times10^{8}\qquad\text{for all }d\ge 78 .
  $$
  **That single number is the entire mechanism of the fix.** The knob controlling that ceiling is \(1/\texttt{RIDGE}\): raise `RIDGE` and the ceiling falls proportionally; lower it and the ceiling rises until float64 noise is back in the answer.

### 16.6 Derivation of the \(\infty\)-norm condition-number example

Take

$$
\mathbf{A}=\begin{pmatrix}1&1\\1&1.001\end{pmatrix}.
$$

Row sums: \(2\) and \(2.001\), so \(\lVert\mathbf{A}\rVert_{\infty}=2.001\).

Determinant \(=1\cdot 1.001-1\cdot 1=0.001\). The \(2\times 2\) inverse formula \(\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}\) gives

$$
\mathbf{A}^{-1}=1000\begin{pmatrix}1.001&-1\\-1&1\end{pmatrix}=\begin{pmatrix}1001&-1000\\-1000&1000\end{pmatrix}.
$$

Row sums of absolute values: \(2001\) and \(2000\), so \(\lVert\mathbf{A}^{-1}\rVert_{\infty}=2001\). Therefore

$$
\kappa_{\infty}(\mathbf{A})=2.001\times 2001=4004.001.
$$

### 16.7 Intuition

Ill-conditioning is a microscope that is aimed almost along a surface: a tiny bump in the input looks like a huge slide in the output. High-degree monomials point those columns in nearly the same direction, so the microscope is badly aimed. Orthogonal polynomials re-aim the columns. They do not repeal floating-point arithmetic, and they do not make an \(n\times p\) matrix with \(p\gg n\) well-posed without a further choice (min-norm, ridge, …).

### 16.8 Worked example (perturbation)

Solve \(\mathbf{A}\mathbf{z}=\mathbf{b}\) with \(\mathbf{A}\) as above and \(\mathbf{b}=\begin{pmatrix}2\\2.001\end{pmatrix}\). The exact solution is \(\mathbf{z}=\begin{pmatrix}1\\1\end{pmatrix}\) (check: \(1+1=2\), \(1+1.001=2.001\)).

Change the second entry of \(\mathbf{b}\) by \(0.001\), to \(\mathbf{b}'=\begin{pmatrix}2\\2.002\end{pmatrix}\). Subtract the two equations:

$$
(1.001-1)z_2=2.002-2\iff 0.001\,z_2=0.002\iff z_2=2,\quad z_1=0.
$$

A relative change in \(\mathbf{b}\) of \(0.001/2.001\approx 5\times 10^{-4}\) produced a relative change in \(\mathbf{z}\) of \(\lVert(1,1)-(0,2)\rVert_{\infty}/\lVert(1,1)\rVert_{\infty}=1\). Amplification \(\approx 2000\), on the order of \(\kappa_{\infty}\approx 4004\).

**Polynomial picture, same moral.** At \(x=\tfrac12\), monomial features of degree \(0\ldots 3\) are \((1,0.5,0.25,0.125)\) — each column is half the previous one. Chebyshev features at the same \(x\) are \((1,0.5,-0.5,-1)\) — they do not collapse. That is why the engine does not use \(1,x,x^{2},x^{3}\).

### 16.9 Connection to ML

This is the numerical backbone of the existing double-descent module, and the likely reason the default run’s test-error “second descent” is a lie (Phase 0, P2–P3). Training loops that solve linear systems (least squares, Newton, some kernel methods) inherit \(\kappa\). Training loops that use GD inherit a related fact: the **condition number of the Hessian** \(\kappa(\mathbf{X}^{\top}\mathbf{X})=\kappa(\mathbf{X})^{2}\) controls how small \(\eta\) must be and how many steps you need. Ill-conditioned features make GD crawl as well as making linear solvers explode.

**[VERIFIED 2026-08-28]** — \(\kappa\) versus degree **has now been measured** on this repo’s Chebyshev + arcsine + relative-ridge path; see §16.4 (monomial contrast) and §16.5a (Chebyshev + arcsine flat to \(d\approx20\); \(p\to n\) as the driver; ridge-imposed ceiling \(\approx 4.6\times10^{8}\); float64 resolution exhausted beyond \(d\approx78\)). The former `NEEDS VERIFICATION` on this point is closed.

What remains open is **not** conditioning but the science: whether this estimator can produce an honest second descent at all. That question is unresolved and is tracked in `docs/phase2-synthesis.md` as a **blocking** issue. No lesson prose about double descent may be authored until it is settled.

---

## 17. Mathematical dependency graph (text)

> **[CORRECTED 2026-08-28] This section is a prerequisite chain, not a shipping order.** It records which piece of mathematics must be understood before which other piece. It is **not** the curriculum order and must not be used as one. **Research D §1.2 is authoritative for curriculum order**, and it deliberately differs (for example, it delays calculus until a loss exists to minimize, and it inserts polynomial regression early as the complexity knob). Where this section and Research D §1.2 disagree, Research D wins.

Read top-down. An arrow `A -> B` means “A is required before B.”

```
Function
  -> Loss function                         [need a scalar score of a function of θ]
  -> Vectors                               [θ, y, r are vectors]
  -> Matrices
       -> Matrix–vector product            [ŷ = X θ is the model]
       -> Transpose                        [Xᵀ moves sample-space → parameter-space]

Loss function + ordinary calculus (one variable)
  -> Derivative                            [slope of J(θ) when p = 1]

Derivative + several parameters
  -> Partial derivative                    [one knob at a time]
       -> Gradient                         [all knobs, as one vector]
            -> Gradient descent            [walk −η ∇J]
            -> Optimization (critical points)

Gradient of MSE + transpose + matvec
  -> Normal equations                      [∇J = 0 ⇔ Xᵀ X θ = Xᵀ y]
       -> Ridge / min-norm dual form       [engine’s two-path solver]
       -> Optimization (closed form)

Matrices + inverse / singular values
  -> Condition number
       -> Ill-conditioning of Vandermonde / Gram matrices
            -> Why Chebyshev + arcsine (existing module)
            -> Why high-degree fits can explode numerically

Optimization
  -> “GD vs normal equations are two solvers for the same J”
```

**A topological order of the graph above** — **[CORRECTED]** this list was previously headed “Suggested lesson order for the curriculum,” which conflicted with Research D. It is one valid linearization of the *mathematical* dependencies, useful for checking that no lesson uses an object it has not defined. **It is not the shipping order; see Research D §1.2.**

1. Function (model as \(f_{\boldsymbol{\theta}}\))
2. Vectors
3. Matrices, matvec, transpose
4. Loss (MSE)
5. Derivative
6. Partial derivative
7. Gradient (and the chain rule example)
8. Gradient descent
9. Optimization (convex quadratic vs neural nets)
10. Normal equations (same problem, closed form)
11. Conditioning, then the existing polynomial / double-descent lab as the payoff

The current site *starts* at step 11’s lab with no rendering and no prior chain. The chain above is what must become explicit — but the sequence in which lessons are **written and shipped** is Research D §1.2 and §6.5, not this list.

---

## 18. Recommended LaTeX rendering approach

> ### ✅ **[VERIFIED 2026-08-28] This section’s core recommendation is CONFIRMED by a real spike in this repo.**
>
> MDX + `remark-math` + `rehype-katex` with `output: "htmlAndMathml"` **builds and statically prerenders on Next 16.3.3 with Turbopack.** Measured results:
>
> - **Client-JS delta for an MDX route: 0 bytes.**
> - `katex.min.js` appears in **no client chunk**.
> - MathML **is present** in the emitted HTML.
> - Plugins **must** be named as **strings**. Turbopack cannot serialize JS functions to Rust, so a plugin passed as a function fails.
> - **`src/mdx-components.tsx` is mandatory** — the build requires it.
>
> Resolved versions in the spike: `@next/mdx` **16.3.3**, `@mdx-js/loader` **3.1.1**, `@mdx-js/react` **3.1.1**, `remark-math` **6.0.0**, `rehype-katex` **7.0.1**, `katex` **0.18.4**.
>
> Configure `rehype-katex` with **`strict: true, throwOnError: true`**. This is a deliberate *accuracy* safeguard, not a style preference: malformed TeX **fails the build** instead of silently rendering wrong mathematics on a page whose whole value proposition is being correct.

### 18.1 Recommendation

**Use KaTeX, rendered on the server, with `output: "htmlAndMathml"`.** Do not put MathJax or `katex.min.js` in the client bundle for lesson prose.

Concretely, when someone implements this (not in this research task):

1. Depend on `katex` **0.18.4** (the version resolved by the confirming spike).
2. Import `katex/dist/katex.min.css` **once** from the root layout (fonts + CSS only).
3. For TSX lesson content, a **Server Component** that calls `katex.renderToString(tex, { displayMode, output: "htmlAndMathml", throwOnError: true })` and injects the HTML. KaTeX is synchronous and runs in Node; this is the documented SSR path.
4. For future MDX lessons (Phase 0 Stage 4), use `remark-math` + `rehype-katex` via `@next/mdx`. **Next.js 16’s official MDX guide uses `rehype-katex` as the example plugin, in exactly the string form** `['rehype-katex', { strict: true, throwOnError: true }]`. Under Turbopack (the Next 16 default for both `dev` and `build`), plugin names must be **strings** with JSON-serializable options, e.g. `rehypePlugins: [['rehype-katex', { output: 'htmlAndMathml', strict: true, throwOnError: true }]]`. Do not pass plugin *functions* (Turbopack cannot pass JS functions to Rust), and do not configure MDX through a `webpack` key — Next 16 ignores webpack unless Turbopack is opted out. **[VERIFIED 2026-08-28]** — this whole pipeline was built and prerendered successfully in this repo; see the box above. `src/mdx-components.tsx` is required.
5. Keep client-side KaTeX for a later, optional island (e.g. a sandbox where a student types TeX). Curriculum pages do not need it.

### 18.2 Why KaTeX, not MathJax

| Criterion | KaTeX | MathJax 3/4 |
| --- | --- | --- |
| Server / build-time HTML | First-class (`renderToString`) | Possible but heavier |
| Client JS if SSR’d | **None** for the math itself | Typically a large runtime |
| Approximate extra weight if client-rendered | Non-trivial: script + CSS + fonts. **[CORRECTED 2026-08-28]** specific byte figures previously quoted here were never measured and have been removed. What *was* measured in this repo: SSR’d MDX math adds **0 bytes** of client JS, so this row is an argument against client rendering, not a number to cite | Larger still; a11y explorer adds more. **[CORRECTED]** the MathJax comparison figures previously in this cell were never checked and are removed |
| Speed / layout shift | Synchronous; no reflow dance | Historically slower; v3 closed some of the gap |
| LaTeX coverage | Subset (enough for this curriculum: `aligned`, `pmatrix`, `\frac`, `\partial`, `\nabla`, `\sum`, `\mathbf`, `\mathbb`, `\ell`, `\lVert`) | Broader |
| Accessibility | Default `htmlAndMathml`: visual HTML plus hidden MathML for AT | Richer: speech-rule engine, explorer, braille; assistive MathML |

**Deciding reason:** Phase 0 already identified whole-app client rendering as a scaling risk (R3) and told us lesson prose should be server HTML. KaTeX is the only mainstream option that turns TeX into static HTML+MathML in Node with **zero math JavaScript on the client**. That is the right default for a curriculum site: formulas are content, not an app. MathJax wins if we later need interactive exploration of expressions for screen-reader users; that is an enhancement, not the foundation.

Do **not** use `react-katex` / `katex-react` for lesson pages: those are client components and would hydrate math that could have been HTML.

### 18.3 Accessibility (what implementers must not skip)

- Keep `output: "htmlAndMathml"` (KaTeX default). HTML is `aria-hidden`; MathML is what NVDA / JAWS / VoiceOver can try to read.
- Do not use `output: "html"` for student-facing math; that drops MathML.
- `output: "mathml"` alone is appealing (no KaTeX CSS) but visual quality depends on the browser’s native MathML (Firefox is strong; Chromium has improved but is not KaTeX). For this product, htmlAndMathml is the conservative visual+AT pair.
- KaTeX’s `render-a11y-string` contrib emits English phrases; it is incomplete (“not implemented yet” for many nodes, reported 2026) and would fight bilingual UI. Prefer MathML, not English `aria-label`s, so Korean locale is not stuck with English speech for formulas.
- Long equations need horizontal scroll. A later a11y pass should add `tabindex="0"` on overflowed `.katex-display` so keyboard users can scroll them (KaTeX has a contrib for this).
- `NEEDS VERIFICATION` — no screen-reader test has been run in this repo. The recommendation is based on KaTeX’s documented default and MathJax’s documented extra explorer, not on NVDA/VoiceOver evidence from this product.

### 18.4 What not to do

- Do not load KaTeX or MathJax from a CDN on each page (Phase 0 wants fewer moving parts; SSR already produced the HTML).
- Do not auto-render `$...$` in the browser with `auto-render.min.js` for static lessons (duplicate work, flash of unstyled TeX, client JS).
- Do not webpack-load MDX (stale blog pattern; Turbopack will ignore it).

---

## 19. Mapping existing copy onto this convention (for whoever writes lessons)

| Today | After this document |
| --- | --- |
| Caption `y = sin(2πx) + noise` | \(y=\sin(2\pi x)+\varepsilon\), \(\varepsilon\sim\sigma\,\mathcal{N}(0,1)\) with \(\sigma=\) `noiseLevel` |
| `x ~ arcsine[-1,1]` | \(x=\cos(\pi U)\), \(U\sim\mathrm{Unif}(0,1)\) |
| Axis label `MSE` | \(J\) on train, \(J_{\mathrm{test}}\) on test; still say “MSE” in the axis title |
| “Parameters” = degree + 1 | \(p=d+1\) |
| Interpolation near degree \(n-1\) | near \(p=n\), i.e. degree \(d=n-1\) |
| Comment `X'` | \(\mathbf{X}^{\top}\) |
| `RIDGE` | **[CORRECTED 2026-08-28]** \(\lambda=\texttt{RIDGE}\cdot\overline{\mathrm{diag}}(\mathbf{G})\) with `RIDGE` \(=10^{-8}\) — a **relative** ridge on the Gram matrix (engine, `src/lib/linalg.ts:19, 45-50`), not an absolute \(10^{-10}\) and not on averaged \(J\). If a lesson exposes \(\lambda\) to a student, state whether the displayed number is absolute or relative (§2.2 warning) |

---

## 20. Items marked NEEDS VERIFICATION

1. ~~**Exact exponential prefactor** for \(\kappa_2\) of a real Vandermonde matrix~~ — **[CLOSED 2026-08-28]**. The secondhand prefactor has been **removed from §16.4** rather than verified. It is replaced by a direct measurement on this repo’s arcsine nodes: \(\log_{10}\kappa\) grows by \(0.389\) per degree (factor \(2.45\)), which matches \((1+\sqrt2)\) to measurement accuracy. Cite the measurement, not a constant.
2. ~~**Measured \(\kappa(\mathbf{X})\) and \(\kappa(\mathbf{X}\mathbf{X}^{\top})\) versus degree**~~ — **[CLOSED 2026-08-28]**. Measured; see §16.4 and §16.5a. Chebyshev + arcsine \(\kappa\in[1.5,3]\) to \(d\approx20\); acceleration past that is driven by \(p\to n\), not the basis; float64 resolution exhausted beyond \(d\approx78\); relative ridge floors \(\kappa\) at \(\approx4.6\times10^{8}\).
   **Still open, and now the blocking item:** whether this estimator can produce an honest second descent (`secondMin < firstMin`). See `docs/phase2-synthesis.md`.
3. **Screen-reader quality** of KaTeX `htmlAndMathml` on the actual lesson pages (NVDA, JAWS, VoiceOver, and Korean vs English). Recommendation is from documentation, not from an AT test of this app.
4. **Completeness of KaTeX 0.18** for any TeX we add later that is not in the subset used here (`aligned`, `cases`, `pmatrix`, standard operators). The formulas in this file are inside KaTeX’s well-supported core. Numbered `\begin{align}` environments and exotic packages are not.

Nothing else in the numbered formulas is tagged. If a reviewer disagrees with an untagged line, that is a bug in this document, not an acknowledged uncertainty.

---

## 21. Sources used (for the reviewer)

- Existing engine: `src/lib/linalg.ts`, `regression.ts`, `metrics.ts`, `dataset.ts`, `i18n.ts`; Phase 0 audit `docs/phase0-project-audit.md`.
- Least squares / min-norm / push-through: standard identities; dual form as implemented in `linalg.ts` and as in e.g. Cornell CS6210 notes (min-norm \(\mathbf{A}^{\top}(\mathbf{A}\mathbf{A}^{\top})^{-1}\mathbf{b}\)); ridge equivalence checked algebraically and with a \(3\times 2\) numerical probe.
- Chebyshev orthogonality: standard; weight \((1-x^{2})^{-1/2}\), norms \(\pi\) and \(\pi/2\).
- Vandermonde ill-conditioning: Beckermann, *Numer. Math.* 85 (2000); Pan, *SIMAX* 37 (2016); Shen & Serkh, *SIAM J. Numer. Anal.* (2023), arXiv:2212.10519.
- KaTeX options: https://katex.org/docs/options.html (`htmlAndMathml` default). `katex@0.18.4` — **[VERIFIED 2026-08-28]** this is the version actually resolved by the confirming spike in this repo, not a release-date claim.
- Next.js 16 MDX + Turbopack string plugins, including a `rehype-katex` example in the literal form `['rehype-katex', { strict: true, throwOnError: true }]`: `node_modules/next/dist/docs/01-app/02-guides/mdx.md`. The same page states that plugins without serializable options cannot be used with Turbopack, because JS functions cannot be passed to Rust.
- **[VERIFIED 2026-08-28]** MDX/KaTeX spike in this repo: builds and statically prerenders on Next 16.3.3 + Turbopack; 0 bytes client-JS delta; no `katex.min.js` in any client chunk; MathML present.
- Worked-example arithmetic: recomputed with Node before writing Section 4–16 numbers.
