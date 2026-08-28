# Phase 1 — Research A: Machine Learning Concepts

**Author role:** Research Agent A (concepts only). No source code was modified.
**Date:** 2026-08-28
**Branch:** `ml-platform-v2`
**Read first:** `docs/phase0-project-audit.md`
**Handoff:** a separate Mathematics-for-ML agent owns derivations of Function, Vector, Matrix, Partial Derivative, Gradient, Chain Rule, and Gradient Descent. Entries in §3 stay conceptual and name that handoff.

**Accuracy rule used here:** textbook-standard claims are stated as such and cited. Non-obvious or research-frontier claims are cited to the original paper. Anything not confidently verified is marked `NEEDS VERIFICATION` inline.

> **[VERIFIED 2026-08-28]** A verification pass audited all four Phase 1 research documents. **This document's mathematics and citations were found sound and appropriately hedged — it was judged the most epistemically careful of the four**, and no substantive claim required correction. Three changes only:
>
> - Stale `RIDGE = 1e-10` references corrected: the engine's ridge is `RIDGE = 1e-8` applied **relative to the mean Gram diagonal** (§0 table, §4.4).
> - **§9 item 6 is RESOLVED for the capped regime** — empirical bias/variance is numerically safe at \(n_{\text{train}}=40\), \(d\le12\), which makes that lab viable (§4.3).
> - **§9 item 7 — the central scientific question — remains OPEN and is now marked BLOCKING.** See §9.

---

## 0. How this maps onto the existing site

The v1 MVP has **one topic** (double descent in polynomial regression), **one route** (`/`), and **no lesson/module abstraction**. Three concept cards exist (overfitting, interpolation threshold, double descent). Analysis notes also mention underfitting. Everything else on the assigned list is missing as teaching content, even when the engine already computes it.

| Concept | Status in v1 | Where it lives today | Recommendation |
| --- | --- | --- | --- |
| Linear Regression | **Implemented, not taught** | Chebyshev polynomial min-norm least squares (`src/lib/regression.ts`, `src/lib/linalg.ts`) | New lesson that names the model the student is already running |
| Logistic Regression | Missing | — | New |
| Classification | Missing | — | New |
| Training / Validation / Test split | **Partially implemented, not taught** | Shuffled 80/20 train/test (`src/lib/dataset.ts`); **no validation set** | Extend: teach the three-way split; the engine currently has only two folds |
| Loss Function | **Used, not named** | MSE (`src/lib/metrics.ts`); UI says “error” | New lesson; reuse the existing error chart |
| Optimization | **Closed-form only, not taught** | Direct min-norm solve, not iterative | New; distinguish closed-form vs iterative |
| Function / Vector / Matrix / Partial Derivative / Gradient / Chain Rule / Gradient Descent | Missing as lessons | Linear algebra used internally | Concept pages here; derivations → Math agent |
| Learning Rate | Missing | No iterative trainer | New (requires Gradient Descent) |
| Batch / Mini-batch / SGD | Missing | Fits are full-batch closed-form | New |
| Backpropagation | Missing | — | New |
| Activation Functions | Missing | — | New |
| Overfitting | **Taught (short card)** | `i18n.ts` concept card + analysis notes + train/test chart | **Extend, do not duplicate** |
| Underfitting | **Mentioned, not a lesson** | Analysis note `analysis.underfitting` only; no concept card | **Extend** into a real lesson |
| Bias–Variance tradeoff | Missing | Classical U-shape is implied by the error chart’s left half | New; this is the story double descent revises |
| Regularization | **Used silently, not taught** | **[CORRECTED 2026-08-28]** `RIDGE = 1e-8` in `linalg.ts`, applied **relative to the mean Gram diagonal** (lines 19, 45-50), not an absolute `1e-10`; min-norm itself is implicit ℓ₂ bias | New; ridge path reuses the existing engine |
| Generalization | **Computed, not taught** | `generalizationGap` in `metrics.ts`; train vs test plotted | New lesson using the existing chart |
| Double Descent | **The whole product** | Experiment + concept card + verdict | **Extend** with theory and honesty about when it fails to appear |
| Interpolation Threshold | **Taught (short card) + detected** | Concept card, detector, chart reference line | **Extend**; detector has known issues (audit P7) |
| Modern generalization theory | Missing | Honesty hedge in the double-descent card only | Defer as a full module; a short “why the U-curve is incomplete” coda on the existing lesson is enough at first |
| Optimization in the overparameterized regime | **Partially embodied, not taught** | Min-norm interpolant when `p > n`; no SGD dynamics | Extend the existing module with a min-norm explanation; defer SGD-implicit-bias experiments |

The existing experiment already *shows* (when the numerics cooperate) underfitting → classical overfitting peak → interpolation → a hoped-for second descent. Students currently have almost no vocabulary for the left half of that curve. Build the missing vocabulary first, then deepen the flagship module rather than cloning it.

---

## 1. Foundations

### 1.1 Linear Regression

**Definition.** A model that predicts a real-valued target as a **linear function of features**: \(y = w^\top \phi(x)\) (plus noise). Features \(\phi(x)\) may be the raw inputs or a fixed nonlinear expansion (polynomials, Chebyshev basis, etc.). Parameters \(w\) are typically chosen to minimize squared error, which for a full-rank underparameterized problem has the closed-form normal equations \(w = (\Phi^\top\Phi)^{-1}\Phi^\top t\) (Bishop, *PRML*, §3.1, eq. 3.15).

**Intuition.** Draw the “best straight-ish fit” through noisy points. “Linear” means linear **in the parameters**, not necessarily in \(x\): a degree-10 polynomial is still linear regression on polynomial features. That is exactly what this site already runs.

**Why it matters.** It is the simplest supervised model, the engine of the existing experiment, and the setting in which loss, overfitting, regularization, interpolation, and double descent can all be seen without a neural net.

**Prerequisites.** Function; Vector; Matrix. Loss Function can be taught in parallel (squared error is the default loss).

**Difficulty.** 2.

**Related concepts.** Loss Function; Optimization; Regularization; Overfitting; Interpolation Threshold; Double Descent.

**Visualization potential (aids understanding).** Scatter of \((x, y)\) with the fitted curve overlaid — already exists as `ModelExplorer`. Add: residual sticks from each point to the curve; a 1-D parameter-vs-loss parabola for \(y = wx\). Decoration to avoid: 3-D loss surfaces for high-degree polynomials.

**Interactive experiment potential.** Student changes polynomial degree (already exists), noise, and \(n\). **New:** toggle monomial vs Chebyshev basis and watch conditioning / coefficient size. **New:** compare the closed-form fit to a few steps of gradient descent on the same squared loss, so “linear regression” is not equated with “one matrix formula.”

**Existing coverage.** The fit is already min-norm least squares on Chebyshev features of \(y = \sin(2\pi x)\) plus Gaussian noise. The student never hears the words “linear regression,” “least squares,” or “normal equations.”

---

### 1.2 Logistic Regression

**Definition.** A linear model for a **class probability**. For binary labels \(t \in \{0,1\}\), \(p(t=1 \mid x) = \sigma(w^\top\phi(x))\) where \(\sigma(a) = 1/(1+e^{-a})\) is the logistic sigmoid. Parameters are found by minimizing the **Bernoulli negative log-likelihood** (binary cross-entropy) \(E(w) = -\sum_n [t_n \log y_n + (1-t_n)\log(1-y_n)]\) (Bishop, *PRML*, §4.3.2, eqs. 4.87–4.90). There is no closed-form maximizer in general; iterative optimization is required.

**Intuition.** Instead of fitting a line through 0/1 labels, squash a linear score into a probability in \((0,1)\). The decision boundary is still a hyperplane in feature space; what changes is the loss and the output type.

**Why it matters.** It is the canonical bridge from regression to classification, and the first place a student meets a loss that is not “distance to the target.”

**Prerequisites.** Linear Regression; Classification; Loss Function; Function (sigmoid as a map \(\mathbb{R}\to(0,1)\)). Gradient Descent is needed to *fit* it interactively.

**Difficulty.** 3.

**Related concepts.** Classification; Activation Functions (sigmoid); Optimization; Regularization. On linearly separable data, unregularized logistic loss has no finite maximizer — \(\|w\|\to\infty\) (Bishop, *PRML*, exercise 4.14 / discussion around linearly separable data). Gradient descent then converges in *direction* to the max-margin separator (Soudry et al., 2018; see §5.4).

**Visualization potential (aids understanding).** 2-D two-class scatter with a moving linear decision boundary and a probability heatmap. Sigmoid overlay on the 1-D projection \(w^\top x\). Decoration: 3-D sigmoid surfaces.

**Interactive experiment potential.** Student places two blobs, fits logistic regression, then makes the blobs linearly inseparable and watches probabilities (not just the 0.5 contour). Separate demo: separable data + no regularization → weights grow without bound while 0–1 train error is already zero — a preview of implicit bias.

---

### 1.3 Classification

**Definition.** Predicting a **discrete label** (class) rather than a real number. The model may output scores or probabilities; a decision rule (e.g. argmax, or threshold 0.5) maps those to a class. The quantity to minimize at test time is often 0–1 error (misclassification rate), which is different from the differentiable **surrogate loss** used in training (cross-entropy, hinge, …).

**Intuition.** Sorting examples into buckets. A good classifier can be confident and wrong, or uncertain and right; accuracy alone hides that.

**Why it matters.** Most headline ML applications are classification. Students who only see regression (this site’s current state) miss decision boundaries, class imbalance, and the loss-vs-metric split.

**Prerequisites.** Function. Loss Function should be taught alongside so “accuracy” is not treated as the training objective.

**Difficulty.** 2.

**Related concepts.** Logistic Regression; Loss Function; Generalization; Overfitting.

**Visualization potential (aids understanding).** 2-D labeled points, decision regions, and a confusion-matrix heatmap. Showing *probability* vs *hard label* side by side is the part that teaches. Decoration: MNIST digit grids with no linked decision.

**Interactive experiment potential.** Two-class 2-D points; student changes a linear boundary by hand and sees accuracy, then compares to a fitted logistic model. Add class imbalance (90/10) so that “always predict the majority class” gets high accuracy — the point of not using accuracy as the only number.

---

### 1.4 Training / Validation / Test split

**Definition.** Partition of labeled data into (at least) two, preferably three, disjoint sets:

- **Training set:** used to fit parameters.
- **Validation set:** used to choose hyperparameters / stop training / pick a model family. It is *not* the final report.
- **Test set:** used **once** to estimate generalization of the chosen model. It must not influence fitting or selection.

The existing app uses a shuffled **80/20 train/test split and no validation set** (`dataset.ts` `trainTestSplit`, `trainRatio` displayed read-only).

**Intuition.** Studying from the answer key (train), taking a practice exam you can still retake (validation), then taking the real exam once (test). Looking at the real exam while studying is cheating; in ML it is called leakage and it inflates reported performance.

**Why it matters.** Every other generalization concept on this list is unmeasurable without a held-out set. It is the highest-leverage experimental hygiene idea in the curriculum.

**Prerequisites.** None from this list (can be taught with a cartoon before any model). Linear Regression makes the first split *felt*.

**Difficulty.** 2.

**Related concepts.** Generalization; Overfitting; Loss Function; Regularization (λ chosen on validation).

**Visualization potential (aids understanding).** Color-coded scatter (already train=blue / test=red). Add a third color for validation. A “you peeked” warning if a control is wired to test error. Decoration: pie charts of 80/20.

**Interactive experiment potential.** (1) Fit a high-degree polynomial while watching train vs test — already exists. (2) **New:** a “cheat” toggle that also plots test error in the degree-selection loop so the student *creates* an optimistic test number, then compares to a never-touched holdout. (3) **New:** introduce a validation slice and use it to pick degree; lock test until the end. This is the cheapest high-value new experiment in the whole survey: the engine already splits data.

---

### 1.5 Loss Function

**Definition.** A scalar \(L(\hat{y}, y)\) measuring how bad a prediction is on one example; training typically minimizes the **average loss** (empirical risk) over the training set. Common choices: squared loss \((\hat{y}-y)^2\) for regression (this site’s MSE); binary/multiclass cross-entropy for probabilistic classification; 0–1 loss for counting mistakes (usually not used as the training objective because it is not differentiable).

Under a Gaussian noise model, maximizing likelihood is equivalent to minimizing sum of squares (Bishop, *PRML*, §3.1.1). Under a Bernoulli model, it is equivalent to minimizing cross-entropy (§4.3.2).

**Intuition.** The scoring rule the training procedure actually obeys. If you change the loss, you change what “best” means. Accuracy is often *not* the loss.

**Why it matters.** Without this word, students cannot understand gradient descent, regularization (loss + penalty), or why interpolating models have train loss ≈ 0. The site currently says “error” and plots MSE without naming it as a loss.

**Prerequisites.** Function. Linear Regression or Classification as the first concrete instance.

**Difficulty.** 2.

**Related concepts.** Optimization; Gradient Descent; Regularization; Generalization (train loss vs test loss); Logistic Regression.

**Visualization potential (aids understanding).** Overlay of squared loss vs absolute loss vs 0–1, as functions of residual. For the existing experiment: the complexity-vs-error chart *is* a train/test loss plot — relabel it. Decoration: generic “descending valley” stock art.

**Interactive experiment potential.** Same polynomial fit, student switches MSE vs mean absolute error and sees the fit become less sensitive to outliers (MAE) vs more (MSE). Classification sibling: train with cross-entropy but *report* 0–1 error, so the two curves are visibly different.

---

### 1.6 Optimization

**Definition.** The process of searching for parameters that make a training objective small. In this curriculum that means: (a) **closed-form** solvers when they exist (least squares), and (b) **iterative** methods, chiefly gradient descent and its stochastic variants. Optimization is not the same as learning: a successful optimizer can drive train loss to zero on random labels (Zhang et al., 2017) without any generalization.

**Intuition.** “How we walk downhill on the loss.” The map is the loss; the walk is the optimizer; arriving at a low train loss does not by itself mean the map matches the world.

**Why it matters.** Names the missing half of “we fit a model.” The current site **skips iterative optimization entirely** (one linear solve per degree). Students who only use this lab will think training = a formula.

**Prerequisites.** Loss Function; Gradient (for iterative methods). Linear Regression shows that sometimes you do not iterate.

**Difficulty.** 3.

**Related concepts.** Gradient Descent; Learning Rate; Batch / Mini-batch / SGD; Backpropagation; Interpolation Threshold (optimization until train loss ≈ 0).

**Visualization potential (aids understanding).** Parameter-space path of GD on a 2-D quadratic bowl vs a banana-shaped valley. For the existing lab: one overlay of “closed-form solution” as the destination of GD. Decoration: particle animations with no loss contour.

**Interactive experiment potential.** 2-D least-squares bowl: student drags an initial \((w_0, w_1)\), hits play, watches GD walk to the closed-form star. Then switch on a non-convex 1-D loss with two minima so “optimization can succeed locally and still be the wrong valley.”

---

## 2. Mathematics for ML (concept-level; derivations owned by the Math agent)

Stay qualitative here. Each entry notes the **handoff**: formulas, proofs, and worked derivatives belong in the Math agent’s document, not in UI copy written from this file.

### 2.1 Function

**Definition.** A mapping that sends each allowed input to exactly one output. In ML, a **model** is a parameterized function \(f(x; w)\); the **target** is another (unknown) function plus noise. This site’s ground truth is \(y = \sin(2\pi x)\) (`dataset.ts`).

**Intuition.** A machine that, given \(x\), emits \(y\). Learning is choosing which machine.

**Why it matters.** Every later concept (model, loss, gradient) is a function of something. Students who lack this word treat “the neural net” as a black box rather than a map.

**Prerequisites.** None.

**Difficulty.** 1.

**Related concepts.** Vector (functions as maps from \(\mathbb{R}^d\)); Linear Regression; Activation Functions.

**Visualization potential (aids understanding).** Interactive \(x \mapsto y\) graph with sliders for a few parameters (line, then sinusoid). Genuinely useful. Decoration: Venn diagrams labeled “domain/codomain.”

**Interactive experiment potential.** Student matches a hidden curve by adjusting 2–3 parameters by hand *before* any optimizer is introduced. Teaches “parameterized family” without calculus.

**Handoff.** Math agent: domain/codomain, composition, identity; distinguish a function from a formula and from a graph.

---

### 2.2 Vector

**Definition.** An ordered list of numbers that can be added and scaled. In ML: a data point \(x \in \mathbb{R}^d\), a parameter vector \(w\), a residual vector, a gradient.

**Intuition.** An arrow, or a column of knobs. “Direction + length” is the picture that later makes gradient descent make sense.

**Why it matters.** Almost every formula on the site is vector arithmetic. The existing solver’s \(\theta\) is a vector of Chebyshev coefficients.

**Prerequisites.** Function (optional).

**Difficulty.** 2.

**Related concepts.** Matrix; Gradient; Linear Regression.

**Visualization potential (aids understanding).** 2-D arrows, addition, scalar multiply. Plot a 2-D \(w\) next to the line it represents. Decoration: 10-D “vector clouds.”

**Interactive experiment potential.** Drag a 2-D \(w\) and see the corresponding line \(y = w_0 + w_1 x\) move. Connects vector to Linear Regression immediately.

**Handoff.** Math agent: \(\mathbb{R}^n\), inner product, Euclidean norm \(\|w\|_2\), orthogonality. The min-norm interpolant in `linalg.ts` is unintelligible without \(\|w\|_2\).

---

### 2.3 Matrix

**Definition.** A rectangular array of numbers representing a **linear map** (and, in ML, a stack of examples). The **design matrix** \(\Phi\) has one row per training point and one column per feature. Matrix–vector products implement “apply the model to a batch.”

**Intuition.** A machine that takes in a vector and emits another vector, linearly. A spreadsheet of the dataset is also a matrix — same object, two jobs.

**Why it matters.** Least squares is a matrix equation. Overparameterization on this site is literally “more columns than rows” (\(p > n\)).

**Prerequisites.** Vector.

**Difficulty.** 2.

**Related concepts.** Linear Regression; Interpolation Threshold (\(p \approx n\)); Optimization.

**Visualization potential (aids understanding).** Small explicit \(\Phi\) (e.g. 5 rows × 3 polynomial columns) next to the scatter plot, highlighting one row as one point. Heatmap of \(\Phi^\top\Phi\) getting ill-conditioned as degree grows — this would explain the audit’s high-degree blow-up pedagogically. Decoration: giant abstract grids.

**Interactive experiment potential.** Student adds polynomial columns one at a time and sees \(\Phi\) widen until it is square (interpolation) then wide (overparameterized). Pair with the existing threshold marker.

**Handoff.** Math agent: multiplication, transpose, inverse vs pseudoinverse, rank. The two branches in `minNormLeastSquares` (\(p \le n\) vs \(p > n\)) are the rank story.

---

### 2.4 Partial Derivative

**Definition.** The derivative of a multivariable function with respect to **one** argument, holding the others fixed. If \(L(w_0, w_1)\) is the loss, \(\partial L / \partial w_0\) says how \(L\) changes if we nudge only the intercept.

**Intuition.** “If I wiggle this one knob, which way does the score move?”

**Why it matters.** The gradient is the list of all partials. Backprop is organized around partials of the loss w.r.t. each weight.

**Prerequisites.** Function. Single-variable derivative is assumed; if the audience may lack it, the Math agent should include a 1-D derivative page first. `NEEDS VERIFICATION` relative to the actual student persona of this site (not specified in the audit).

**Difficulty.** 3.

**Related concepts.** Gradient; Chain Rule; Gradient Descent; Backpropagation.

**Visualization potential (aids understanding).** A 3-D loss surface with a tangent line parallel to one axis. Cross-section sliders. This *does* aid understanding. Decoration: unlabelled contour rainbows.

**Interactive experiment potential.** 2-parameter linear model; student moves \(w_0\) or \(w_1\) with the other locked and sees the loss change; numerically compare \(\Delta L / \Delta w\) to the partial.

**Handoff.** Math agent: definition as a limit, computational rules, notation \(\partial\) vs \(d\).

---

### 2.5 Gradient

**Definition.** The vector of all partial derivatives, \(\nabla L(w)\). It points in the direction of **steepest increase** of \(L\). For differentiable \(L\), a first-order necessary condition for an interior minimum is \(\nabla L(w) = 0\).

**Intuition.** The arrow that says “uphill is that way.” Learning steps the other way.

**Why it matters.** It is the interface between calculus and every first-order optimizer. Without it, learning rate and SGD are folklore.

**Prerequisites.** Partial Derivative; Vector.

**Difficulty.** 3.

**Related concepts.** Gradient Descent; Chain Rule; Backpropagation; Learning Rate.

**Visualization potential (aids understanding).** Contour plot with gradient arrows (always perpendicular to contours). Overlay one GD step. High teaching value. Decoration: arrows on a network diagram with no contours.

**Interactive experiment potential.** Student clicks a point on a 2-D loss contour; the gradient arrow appears; they must choose a step that decreases \(L\). Wrong-sign steps are the misconception to burn in.

**Handoff.** Math agent: \(\nabla\) definition, directional derivatives, gradient of squared loss \(\Phi^\top(\Phi w - t)\) (Bishop eq. 3.13, up to scaling).

---

### 2.6 Chain Rule

**Definition.** The derivative of a composition: if \(y = f(g(x))\), then \(dy/dx = f'(g(x))\, g'(x)\). In several variables, Jacobians multiply. Neural nets are long compositions; this is why gradients are computable.

**Intuition.** A change at the input is scaled by each layer’s local sensitivity, in sequence — like gears.

**Why it matters.** Backpropagation *is* the chain rule applied to a computational graph, organized to reuse intermediate derivatives (Rumelhart, Hinton & Williams, 1986, popularized this for nets; the calculus is older).

**Prerequisites.** Partial Derivative; Function (composition).

**Difficulty.** 3.

**Related concepts.** Backpropagation; Activation Functions; Gradient Descent.

**Visualization potential (aids understanding).** Two chained 1-D functions with sliders; show \(\Delta x \to \Delta u \to \Delta y\) and the product of slopes. Computational-graph nodes with local \(\partial\). High value. Decoration: huge multi-layer cartoons with no numbers.

**Interactive experiment potential.** Student sets slopes of two pieces of a broken-linear map and predicts the composite slope, then checks. Next: a one-hidden-unit network \(x \mapsto \sigma(wx+b)\) and numeric \(\partial L/\partial w\).

**Handoff.** Math agent: 1-D proof, multivariable statement, Jacobian product. Do not bury students in index-heavy backprop algebra on the concept page.

---

### 2.7 Gradient Descent

**Definition.** The iteration \(w^{(\tau+1)} = w^{(\tau)} - \eta \nabla L(w^{(\tau)})\), where \(\eta > 0\) is the learning rate (Bishop, *PRML*, §5.2.4, eq. 5.41). It is a **batch** method when \(\nabla L\) uses the whole training set. It finds a stationary point of a differentiable objective; it does not, in general, find a global minimum of a non-convex \(L\).

**Intuition.** Take a small step downhill, repeat. Too large a step overshoots; too small a step crawls.

**Why it matters.** The workhorse of modern training and the first optimizer students should *see* moving. This site currently never shows it.

**Prerequisites.** Gradient; Loss Function; Learning Rate (can be introduced in the same lesson). Linear Regression is the first objective to run it on (convex quadratic).

**Difficulty.** 3.

**Related concepts.** Learning Rate; Batch / Mini-batch / SGD; Optimization; Backpropagation.

**Visualization potential (aids understanding).** Path on contours; loss-vs-epoch curve. Side-by-side: GD path vs the closed-form least-squares star. High value. Decoration: rocket-ship “training” metaphors.

**Interactive experiment potential.** See §4.1 Learning Rate — the same widget. Convex bowl first (cannot fail if \(\eta\) is small enough), then a simple non-convex 1-D function (can fail).

**Handoff.** Math agent: why the negative gradient is a descent direction, step-size restrictions for quadratics (Lipschitz / smoothness), difference between gradient *flow* and discrete GD. Implicit-bias theorems (min-norm for least squares from 0; max-margin for logistic) can be *stated* in Advanced; proofs stay with Math or a theory appendix.

---

## 3. Model Training

### 3.1 Learning Rate

**Definition.** The positive scalar \(\eta\) in the gradient update that scales the step. It is a hyperparameter, not learned by vanilla GD. If it is too large, loss can diverge; if too small, training is slow and, with a budget of steps, underfits.

**Intuition.** Stride length while walking downhill. The gradient gives direction (and a magnitude); \(\eta\) decides how much of that vector you trust in one step.

**Why it matters.** It is the first hyperparameter every student will tune, and the cheapest interactive “aha” in training. It also forces the validation-set idea: you cannot pick \(\eta\) on the test set.

**Prerequisites.** Gradient Descent; Loss Function. Training/Validation/Test split for honest tuning.

**Difficulty.** 2.

**Related concepts.** Batch / Mini-batch / SGD; Optimization; Underfitting (too-small \(\eta\) + few steps).

**Visualization potential (aids understanding).** Loss-vs-step for three \(\eta\) values on the same problem: crawl / converge / diverge. Trajectory on contours. High value.

**Interactive experiment potential.** Student slides \(\eta\) on 1-D or 2-D least squares and watches the parameter bounce or crawl. Optional: a “too few steps” budget so small \(\eta\) looks like underfitting. Do **not** claim a universal “linear scaling rule” (\(\eta \propto\) batch size) as fact for this site’s models — that is an ImageNet training heuristic (Goyal et al., 2017) whose range of validity is `NEEDS VERIFICATION` for toy polynomial / tiny-net settings.

---

### 3.2 Batch / Mini-batch / SGD

**Definition.** How many examples enter each gradient estimate:

- **Batch (full-batch) GD:** \(\nabla L\) averaged over all \(n\) training points. Deterministic given \(w\).
- **Stochastic GD (classical):** one example per update (Bishop, *PRML*, §3.1.3, eq. 3.22, “sequential / stochastic gradient descent”).
- **Mini-batch SGD:** a random subset of size \(B\) with \(1 < B < n\). This is the practical default in deep learning; people often say “SGD” for this too.

**Intuition.** Full-batch looks at everyone before taking a step (accurate, expensive, smooth). SGD peeks at one person (noisy, cheap, can escape shallow holes). Mini-batch is a compromise.

**Why it matters.** Explains noisy loss curves, why epoch count ≠ update count, and why two runs differ. The current engine has no batches because it does not iterate.

**Prerequisites.** Gradient Descent; Loss Function. Training split (the batch is drawn from *train*, never test).

**Difficulty.** 3.

**Related concepts.** Learning Rate; Optimization; Backpropagation; Overfitting (more passes / epochs increase effective complexity — see Nakkiran EMC, §5.1).

**Visualization potential (aids understanding).** Loss curve: smooth (batch) vs jittery (SGD). Arrows on a contour: batch arrow vs a fan of single-example arrows whose average is the batch arrow. High value.

**Interactive experiment potential.** Same quadratic or small logistic problem; slider for \(B \in \{1, \ldots, n\}\). Student sees noise vs speed. Count **epochs** vs **updates** explicitly so that misconception dies.

---

### 3.3 Backpropagation

**Definition.** An efficient algorithm to compute \(\nabla_w L\) for a composed model (a neural net) by applying the chain rule from the outputs back to the inputs, **reusing** intermediate derivatives so each layer is visited a constant number of times per example — not an exponential explosion of paths. Popularized for multilayer nets by Rumelhart, Hinton & Williams, *Nature* 323:533–536 (1986). Earlier automatic-differentiation / control-theory work exists (e.g. Werbos); `NEEDS VERIFICATION` of the best historical one-liner for a student-facing citation. Backprop computes gradients; it is **not** itself the learning rule (the learning rule is GD/SGD *using* those gradients).

**Intuition.** Credit assignment: the output was wrong by this much; each earlier knob is blamed in proportion to how much it affected that error.

**Why it matters.** It is why deep nets are trainable. Without it, Chain Rule stays a calculus trick.

**Prerequisites.** Chain Rule; Gradient; Activation Functions; Loss Function. A one-hidden-layer net is enough.

**Difficulty.** 4.

**Related concepts.** Gradient Descent; Activation Functions; Optimization.

**Visualization potential (aids understanding).** A 1-hidden-layer, 2-weight numeric example with every local derivative written on the edges, then the products. Forward numbers in one color, backward in another. High value if kept tiny. Decoration: 50-layer ResNet cartoons.

**Interactive experiment potential.** Tiny network (2 inputs, 2 hidden, 1 output). Student edits one weight, sees forward outputs change, then runs one backward pass and checks that a tiny GD step on that weight reduces loss. Optional numeric gradient check (finite difference vs backprop) — this is the credibility widget.

---

### 3.4 Activation Functions

**Definition.** The pointwise nonlinearity after an affine layer, e.g. sigmoid \(\sigma(a)=1/(1+e^{-a})\), tanh, ReLU \(\max(0,a)\). Without them, stacking linear layers collapses to one linear map. Logistic regression *is* a single neuron with a sigmoid (or a softmax in the multiclass case).

**Intuition.** The “bend.” Linear pieces with ReLU, or smooth squashes with sigmoid. The network’s expressivity comes from these bends.

**Why it matters.** Explains why depth can help, why saturating sigmoids slow learning (small gradient), and why ReLU became default in many modern nets (Goodfellow, Bengio & Courville, *Deep Learning*, Ch. 6 — treat architectural fashion as historical, not as a theorem).

**Prerequisites.** Function; Linear Regression (affine piece); Chain Rule for the derivative used in backprop.

**Difficulty.** 2–3.

**Related concepts.** Logistic Regression; Backpropagation; Underfitting (linear model = identity activation).

**Visualization potential (aids understanding).** Plot of \(\sigma\), tanh, ReLU and their derivatives on the same axes. Composition of two ReLUs making a piecewise-linear curve. High value. Decoration: brain-synapse clip art.

**Interactive experiment potential.** Student builds a 1-D piecewise-linear function from 3–4 ReLU units (sliders on weights/biases) to match a target curve — “features are learned bends.” Second: train a 1-hidden-layer net on XOR-like 2-D points with identity vs ReLU activations; identity cannot separate, ReLU can. (XOR is linearly inseparable — standard; the ReLU net succeeding is empirical for a given width/seed and should be shown, not asserted as always-on-first-try.) `NEEDS VERIFICATION` of a reliably succeeding default width/seed before shipping that demo.

**Known pedagogical trap.** Students conclude “ReLU is linear, so the whole net is linear.” The lesson must show the *kink* and a two-ReLU piecewise map.

---

## 4. Generalization

### 4.1 Overfitting — **extend existing**

**Definition.** Fitting the training sample so closely (including noise) that **performance on new data from the same distribution gets worse**. Operationally: training loss continues to improve (or is excellent) while test loss degrades relative to a simpler alternative. It is a statement about **the gap and the test number**, not about parameter count alone.

Existing copy (`i18n.ts` concepts.overfitting) is conceptually sound: memorizing noise, great train error, worse test error.

**Intuition.** Memorizing the practice problems, including the typos.

**Why it matters.** It is the primary failure mode students are taught to fear — and the one that double descent later *complicates*. If this lesson overclaims “more parameters ⇒ overfitting,” the flagship module becomes a contradiction instead of a sequel.

**Prerequisites.** Training/Validation/Test split; Loss Function; Linear Regression (or any model whose capacity can grow).

**Difficulty.** 2.

**Related concepts.** Underfitting; Bias–Variance tradeoff; Regularization; Interpolation Threshold; Double Descent; Generalization.

**Visualization potential (aids understanding).** The existing train/test vs degree chart **is** the right picture. Strengthen it: overlay the fitted curve at a well-generalizing degree vs a wiggly interpolating degree (`ModelExplorer` already does one degree). High value. Decoration: none needed.

**Interactive experiment potential.** Already exists (noise slider + degree sweep). **Extend:** (1) a named “overfit this” preset; (2) show that reducing noise shrinks the train/test gap at high degree — overfitting is about fitting *noise*, not about polynomials being evil; (3) do **not** auto-label every \(p > n\) fit as overfitting (that fights double descent).

**Existing coverage.** Concept card + analysis notes + error chart. Missing: contrast with underfitting as a peer card; missing: “overfitting ≠ interpolating” which the interpolation-threshold card only hints at.

---

### 4.2 Underfitting — **extend existing**

**Definition.** The model class or training procedure is too weak to capture the predictable structure in the data: **both train and test error stay high**, and they stay close to each other. Causes include too-small capacity, too-strong regularization, too-few training steps, or a missing feature.

Existing analysis note (`analysis.underfitting`) already describes low-complexity, both errors high. There is **no concept card**.

**Intuition.** Bringing a straight line to a sine wave.

**Why it matters.** Students taught only “avoid overfitting” respond by using a model that is too simple. The left side of the existing error chart is this.

**Prerequisites.** Loss Function; Training/Test split; Linear Regression.

**Difficulty.** 2.

**Related concepts.** Overfitting; Bias–Variance (high bias); Learning Rate (insufficient optimization can *look* like underfitting); Activation Functions.

**Visualization potential (aids understanding).** Degree-1 fit on \(\sin(2\pi x)\) — already available by selecting a low degree. Pair with the error-chart left region. High value.

**Interactive experiment potential.** Existing sweep. **Extend:** a preset “underfit this” (degree 1, moderate \(n\)); a second preset where the model is rich but \(\eta\) is tiny and steps are few, to show underfitting is not only “too few parameters.”

**Existing coverage.** Analysis note only. Promote to a lesson peer of overfitting.

---

### 4.3 Bias–Variance tradeoff

**Definition.** For **squared loss**, the expected prediction error at a point decomposes as

\[
\mathbb{E}\big[(y - \hat f(x))^2\big] = \underbrace{\big(f(x) - \mathbb{E}[\hat f(x)]\big)^2}_{\mathrm{bias}^2} + \underbrace{\mathrm{Var}(\hat f(x))}_{\mathrm{variance}} + \underbrace{\sigma^2}_{\mathrm{irreducible\ noise}}
\]

where \(y = f(x)+\varepsilon\), \(\mathbb{E}[\varepsilon]=0\), \(\mathrm{Var}(\varepsilon)=\sigma^2\), and the expectation is over training sets (and noise). Standard textbook statement: Hastie, Tibshirani & Friedman, *Elements of Statistical Learning*, Ch. 7.

Classical pedagogy: as model complexity grows, bias falls and variance rises; the U-shaped test-error curve is their sum. **This decomposition is for squared loss.** A similarly tidy three-term story for 0–1 loss is `NEEDS VERIFICATION` as a teaching default (there *is* literature, e.g. Domingos 2000; whether to use it in v2 is a curriculum choice, not a fact to assert casually).

**Intuition.** Bias: the model’s typical answer is systematically off (wrong shape). Variance: the answer jumps when you redraw the training set. Noise: even a perfect model cannot predict the coin flip.

**Why it matters.** It is the *classical* explanation of the U-curve that this site’s flagship result both contains (left of interpolation) and **exceeds** (right of interpolation). Teaching double descent without this is like teaching relativity without Newton — no contrast.

**Prerequisites.** Loss Function (squared); Overfitting; Underfitting; Training/Test split; Linear Regression. Function (the unknown \(f\)).

**Difficulty.** 4.

**Related concepts.** Regularization; Double Descent (the U is only half the picture — Belkin et al., 2019); Generalization.

**Visualization potential (aids understanding).** Many thin fitted curves (repeated datasets) plus their average (bias) plus a spread band (variance). Complexity on the x-axis, three stacked areas (bias², variance, noise) plus test error. This is one of the highest-value charts in ML education. Decoration: dartboard “bullseye” metaphors that confuse statistical bias with aiming.

**Interactive experiment potential.** **Strongest reuse of the existing engine after the split lesson.** Student sets degree and noise; the app draws \(k\) independent training sets of size \(n\) (vary the seed) and overlays the \(k\) curves. Compute empirical bias² and variance at a grid of \(x\). Sweep degree: variance explodes near interpolation.

**[RESOLVED 2026-08-28] for the capped regime.** Empirical bias/variance on this Chebyshev setup **is numerically safe** at \(n_{\text{train}} = 40\), \(d \le 12\): measured \(\kappa(\mathbf{X}) \lesssim 2\) and \(\lVert\theta\rVert_2 \le 0.73\) across the whole grid. **That makes the bias–variance lab viable** — the earlier concern does not block it. It is **not** safe at \(d \gtrsim 40\) with \(n = 80\), so the cap is the thing doing the work and it must be **enforced in code**, not merely stated (Research C §7.9). Note also that a degree sweep capped at 12 cannot show variance exploding "near interpolation," because it never reaches interpolation; say that in the copy rather than implying the fan-out is the interpolation peak.

---

### 4.4 Regularization

**Definition.** An explicit modification of the training problem that penalizes complexity or otherwise constrains the solution, e.g. **ridge** (Tikhonov): minimize \(\|\Phi w - t\|_2^2 + \lambda \|w\|_2^2\). Related: Lasso (\(\lambda \|w\|_1\)), early stopping, dropout, data augmentation. \(\lambda\) is typically chosen on a **validation** set.

**[CORRECTED 2026-08-28]** The existing solver already adds a ridge “so the Gram matrix is invertible without erasing interpolation / double-descent phenomenology” (`linalg.ts`) — but it is **relative**, not the absolute \(\lambda=10^{-10}\) recorded here previously. It applies \(\lambda = \texttt{RIDGE}\cdot\overline{\mathrm{diag}}(\mathbf{G})\) with `RIDGE` \(= 10^{-8}\) and \(\overline{\mathrm{diag}}\) the mean diagonal of the Gram matrix (`src/lib/linalg.ts:19, 45-50`), which keeps the regularization dimensionless as the degree changes. The applied \(\lambda\) therefore *moves with the problem*: the mean Gram diagonal was measured at \(\approx 41\) at \(p=41\) and \(\approx 2.3\) at \(p=161\). That is regularization used as numerics, not as a lesson. The **min-norm interpolant** (the \(p > n\) branch) is equivalent to the \(\lambda \to 0^+\) limit of ridge — the “ridgeless” estimator studied by Hastie, Montanari, Rosset & Tibshirani (2022).

**Intuition.** A tax on using big weights, so the model prefers a simpler explanation that still fits reasonably.

**Why it matters.** It is the standard practical control for overfitting in the classical regime, and the right sequel to the existing lab (audit Stage 5: “regularization paths are natural neighbors that reuse the same regression engine”).

**Prerequisites.** Linear Regression; Loss Function; Overfitting; Vector (norm). Validation split to choose \(\lambda\).

**Difficulty.** 3.

**Related concepts.** Bias–Variance; Interpolation Threshold; Double Descent; Optimization in the overparameterized regime (implicit regularization).

**Visualization potential (aids understanding).** Coefficient magnitudes vs \(\lambda\); train/test error vs \(\lambda\) (U-shape in the classical regime). Overlay two fitted curves: \(\lambda \approx 0\) wiggly vs moderate \(\lambda\) smooth. High value.

**Interactive experiment potential.** **High leverage, moderate cost.** Reuse `minNormLeastSquares` with a student-facing \(\lambda\) slider (today’s `RIDGE` is a hidden constant, and `minNormLeastSquares` still takes no \(\lambda\) argument). **[CORRECTED 2026-08-28]** Because the engine's \(\lambda\) is **relative to the mean Gram diagonal**, a slider over absolute \(\lambda\) would display a different number from the one applied, by a factor that itself changes as the student drags degree. **Decide and document whether the student-facing \(\lambda\) is absolute or relative before building the slider** (Research C §4.3; Research B §2.2). Then sweep \(\lambda\) at fixed degree, and sweep degree at several \(\lambda\). Show that enough ridge can **erase** interpolation (train MSE no longer hits ~0) — connecting Regularization to Interpolation Threshold.

---

### 4.5 Generalization

**Definition.** Performance of the fitted predictor on **new** examples drawn from the same distribution as the training data, not seen during fitting or selection. **Generalization error** (risk) is expected test loss; the **generalization gap** is often reported as test loss − train loss (this site already computes `generalizationGap` in `metrics.ts` as `testMSE - trainMSE`). A small gap with high absolute test error is still bad (underfitting). A tiny train loss with large test loss is overfitting. The goal is small **test** loss, not a small gap for its own sake.

**Intuition.** Doing well on tomorrow’s data, not on today’s homework.

**Why it matters.** It is the actual objective of supervised learning (Belkin et al., 2019, opening: the mismatch between empirical risk and true risk). Every chart on the existing site is in service of this word, which is never taught.

**Prerequisites.** Training/Validation/Test split; Loss Function.

**Difficulty.** 3 (the *word* is easy; honest estimation is not).

**Related concepts.** Overfitting; Underfitting; Bias–Variance; Double Descent; modern generalization theory.

**Visualization potential (aids understanding).** Train vs test curves (exists). A single number “gap” next to both absolute errors so students do not optimize the gap. High value, mostly labeling.

**Interactive experiment potential.** Existing experiment plus: (1) changing \(n\) and seeing test error drop in the classical regime; (2) a cautionary “more data can hurt” *preview* only after Interpolation / Double Descent (Nakkiran et al., 2019/2021) — do not put that surprise in the first generalization lesson.

**Existing coverage.** Implicit in every plot. Needs a lesson that defines risk vs empirical risk in one paragraph, then points at the chart.

---

## 5. Advanced

Cite non-obvious claims. This section is the scientific spine of the existing product.

### 5.1 Double Descent — **extend existing**

**Definition.** A test-risk curve that, as a function of model capacity, first follows the classical U-shape (descent, then ascent) and then, after the **interpolation threshold**, **descends again**. Named and proposed as a general pattern by Belkin, Hsu, Ma & Mandal, *PNAS* 116(32), 2019 (arXiv:1812.11118, 2018). Earlier related observations exist (e.g. Opper 1995/2001; Advani & Saxe 2017; Spigler et al. 2018; Geiger et al. 2019) — Belkin et al. named and unified the picture; Nakkiran et al. cite that lineage.

Nakkiran, Kaplun, Bansal, Yang, Barak & Sutskever, “Deep Double Descent: Where Bigger Models and More Data Hurt,” arXiv:1912.02292 (2019); *J. Stat. Mech.* 2021, 124003, showed the pattern for modern deep nets and also:

- **Epoch-wise** double descent (test error vs training time).
- **Sample-wise non-monotonicity:** increasing \(n\) can *raise* test error for some model sizes because it shifts the interpolation peak.
- Unifying hypothesis via **effective model complexity (EMC):** the largest \(n\) on which a training procedure reaches ≈ 0 training error. They note \(\varepsilon = 0.1\) is a heuristic (`NEEDS VERIFICATION` as a portable constant; they say they lack a principled choice).

Belkin’s mechanism (RFF / min-norm story): past interpolation, larger classes contain interpolators of **smaller norm** (smoother / simpler in that sense), so test risk can fall even though train risk is already zero.

**Intuition.** Classical: “past the sweet spot, bigger is worse.” Modern: “once you can interpolate, even bigger can be better again.” The ugly spike is *at* the knife-edge of just barely interpolating.

**Why it matters.** It is the product’s reason for existing. It is also easy to overclaim: the existing card correctly says it does not appear in every run. Audit P2 documents a default run that reports “Possible Double Descent” on a numerical explosion, not a real second descent.

**Prerequisites.** Overfitting; Underfitting; Interpolation Threshold; Linear Regression; Generalization; Bias–Variance (as the theory being extended, not replaced with a slogan). Regularization (min-norm / ridge) for the mechanism.

**Difficulty.** 5.

**Related concepts.** Interpolation Threshold; Bias–Variance; Regularization; Optimization in the overparameterized regime; modern generalization theory.

**Visualization potential (aids understanding).** The existing error chart **is** the visualization. Needed extensions: (1) coefficient-norm vs degree (Belkin Fig. 2 analogue) — the mechanism; (2) an honest “no second descent” state that does not look like a log-scale success; (3) later, a small epoch-wise heat map if a neural module is added. Decoration: any chart that always draws a cartoon W-shape independent of the run (violates the product’s honesty rule).

**Interactive experiment potential.** Already the core product. **Extend, don’t clone:** noise and \(n\) sliders exist; add coefficient-norm series; add a \(\lambda\) slider (ridge vs ridgeless); add a “label noise vs input noise” distinction if a classification module appears (Nakkiran: peaks are stronger with label noise). Epoch-wise and “more data hurts” experiments **require iterative training of a model whose EMC can be swept** — not the current closed-form polynomial sweep — and belong in a later module.

**Existing coverage.** Whole app. Gaps: no min-norm explanation, no epoch/sample axes, no bias–variance contrast lesson, and a detector/numerics credibility problem (audit §3.3). `NEEDS VERIFICATION` (inherited from the audit, still open): whether this Chebyshev + tiny-ridge setup can produce a genuine second descent with `secondMin < firstMin` for any reachable configuration.

---

### 5.2 Interpolation Threshold — **extend existing**

**Definition.** The capacity at which the model becomes able to **fit the training set essentially perfectly** (train risk ≈ 0). Belkin et al. (2019) identify function-class capacity with the number of parameters and mark interpolation as the separator between the classical U-curve and the “modern interpolating regime.” For linear models with \(p\) parameters and \(n\) training points, this is typically near \(p = n\) (square design matrix), which is why the UI expects interpolation near degree \(n_{\mathrm{train}}-1\).

Nakkiran et al. emphasize that for trained neural nets the relevant location is where **the training procedure’s EMC** matches \(n\), not merely raw parameter count — changing optimizer, epochs, or label noise moves the peak.

Existing card (`i18n.ts` concepts.threshold) matches Belkin’s meaning and correctly hedges that test error *often* peaks there.

**Intuition.** The first moment the model has enough knobs to memorize the homework. Memorizing is possible; there is essentially no leftover freedom to also be smooth. More knobs later restore choice among interpolators.

**Why it matters.** It is the x-axis landmark of the flagship chart. Misidentifying it (audit P7: detector vs predicted degree) is a student-facing bug, not just a numeric one.

**Prerequisites.** Linear Regression; Loss Function; Overfitting; Matrix (rank / \(p\) vs \(n\)).

**Difficulty.** 4.

**Related concepts.** Double Descent; Regularization (ridge can prevent interpolation); Optimization (when “train error ≈ 0” depends on training time).

**Visualization potential (aids understanding).** Vertical line on the error chart (exists). Add: train MSE on a log axis hitting the noise floor; a “degrees of freedom leftover” sketch (\(p-n\)). High value. Decoration: a threshold “gate” illustration.

**Interactive experiment potential.** Existing. **Extend:** (1) show \(p = \mathrm{degree}+1\) and \(n_{\mathrm{train}}\) as two numbers whose crossing *is* the threshold; (2) noise-scaled interpolation criterion (audit recommendation) so the line matches the hint; (3) increase \(\lambda\) until interpolation disappears.

**Existing coverage.** Card + detector + reference line. Detector uses a fixed train-MSE cutoff `1e-3` (not noise-scaled) — known limitation.

---

### 5.3 Modern generalization theory

**Definition (what can be honestly taught).** There is **no single replacement theorem** that explains deep-net generalization. What can be taught as a short advanced lesson is a **sequence of results that broke the old story** and a few that rebuilt pieces of it for **linear / kernel / ridgeless** models:

1. **Classical uniform-convergence / complexity-control story.** Constrain \(\mathcal{H}\) so that train risk tracks test risk; interpolating predictors are treated as overfit. Textbook corollary quoted by Belkin et al. (2019): a model with zero training error “will typically generalize poorly.”

2. **Zhang, Bengio, Hardt, Recht & Vinyals, ICLR 2017** (arXiv:1611.03530). Standard CNNs **fit random labels** (and even random-noise inputs) to ~100% train accuracy. Explicit regularizers help but are **neither necessary nor sufficient** to explain generalization. Conclusion: classical capacity measures that would forbid interpolating noisy labels do not explain why the same nets generalize on real labels.

3. **Belkin et al., 2019.** Phenomenology: extend the U-curve through interpolation (double descent); prefer **low-norm interpolators**.

4. **Bartlett, Long, Lugosi & Tsigler, PNAS 2020**, “Benign overfitting in linear regression.” For the **minimum-norm interpolating linear predictor**, near-optimal test accuracy is possible despite fitting noise. Characterization in terms of two **effective ranks** of the covariance: overparameterization must provide **many low-variance, unimportant directions** in which to hide label noise. Not automatic in every high-\(p\) problem.

5. **Hastie, Montanari, Rosset & Tibshirani, Annals of Statistics 2022** (arXiv:1903.08560). Precise asymptotics of **ridgeless** least squares in the proportional regime \(p/n \to \gamma\): double descent of prediction risk, including a peak at \(\gamma = 1\), for linear and random-feature models.

**What this is not.** It is not “VC dimension is false.” It is: the measures that successfully predicted the classical U-curve do **not**, by themselves, predict when interpolating overparameterized models work.

**Intuition.** Old rule: don’t memorize. New observation: some memorizers still generalize, if the extra parameters are used to spread noise into harmless directions and/or the algorithm picks a simple interpolator. We can prove this in linear models; deep nets remain partly empirical.

**Why it matters.** Prevents the curriculum from teaching a lie in week 2 (U-curve as the whole truth) and an unexplained miracle in week 8 (double descent). Gives the existing lab a reading list instead of a vibe.

**Prerequisites.** Generalization; Bias–Variance; Interpolation Threshold; Regularization; Double Descent. Matrix / covariance intuition (Math agent).

**Difficulty.** 5.

**Related concepts.** All of Advanced; Overfitting (needs a refined definition).

**Visualization potential (aids understanding).** (1) Reproduction of Zhang-style message at toy scale: two models with identical near-zero train loss, one on true labels (decent test) and one on shuffled labels (chance test) — **this is the figure**. (2) Schematic covariance spectrum: a few large eigenvalues + a long tail (Bartlett intuition). Do not fake a “theory complete” dashboard. `NEEDS VERIFICATION`: whether a tiny ReLU net in-browser can fit random labels on a 2-D toy set fast enough to be a fair demo; if not, keep Zhang as a described experiment with a figure reproduced from the paper (with permission / fair-use diagram redraw).

**Interactive experiment potential.** Highest-cost item in this document if done honestly. **Defer** a full Zhang replay. A **linear** “benign vs harmful interpolation” demo is more feasible: isotropic vs spiked covariance, min-norm interpolant, test MSE — aligned with Bartlett’s message and with the existing least-squares engine. Design of that covariance toy is `NEEDS VERIFICATION` (must actually show the contrast, not a flat line).

---

### 5.4 Optimization behavior in the overparameterized regime

**Definition.** When \(p > n\) (or a net interpolates), the training objective has **many global minimizers** (for least squares: an affine space of interpolators). Which one you get is decided by the **algorithm**, not by the loss alone. This is **implicit regularization / implicit bias**.

Established pieces, with scope limits:

- **Least squares + GD/gradient flow from \(w=0\):** converges to the **minimum Euclidean-norm interpolant**, i.e. the Moore–Penrose solution (classical; see e.g. Engl et al. 1996 as cited in later implicit-bias surveys; Gunasekar et al. on mirror descent generalizing the geometry). This is exactly what `minNormLeastSquares` computes in closed form on this site.
- **Logistic / exponential-tailed losses on linearly separable data + GD:** \(w(t)/\|w(t)\|\) converges to the **ℓ₂ max-margin** (hard-margin SVM) direction, slowly, on the order of \(1/\log t\) (Soudry, Hoffer, Nacson, Gunasekar & Srebro, *JMLR* 19(70), 2018). Changing the optimizer (e.g. Adam) can change the bias (same paper’s discussion).
- **Deep nets + SGD:** widely believed to prefer “simple” interpolators; **not fully characterized**. Nakkiran et al. (OpenAI blog / paper): in the overparameterized regime many interpolators exist and SGD “leads to good models, for reasons we don’t yet understand.” Treat slogans like “SGD = implicit L2” as `NEEDS VERIFICATION` / false as a universal theorem.
- **Training longer** can increase EMC and produce epoch-wise double descent (Nakkiran et al.). **Early stopping** can keep a model from interpolating; they report early stopping often removes the phenomenon, with at least one exception (ResNets on CIFAR-100, no label noise, model-wise DD with optimal early stopping — paper Fig. 19). Do not teach “early stopping always prevents double descent.”

**Intuition.** Extra parameters create a big room full of perfect homework-memorizers. The optimizer walks into one of them. Starting at 0 and following least-squares GD picks the one closest to the origin. That one is often (not always) better on the test set than the interpolator that sits at the interpolation peak.

**Why it matters.** It is the missing caption under this site’s \(p > n\) branch. Students currently see a formula; they should hear “we picked the smallest coefficient vector that still interpolates.”

**Prerequisites.** Optimization; Gradient Descent; Interpolation Threshold; Regularization; Linear Regression; Vector (norm). Logistic Regression for the max-margin story.

**Difficulty.** 5.

**Related concepts.** Double Descent; Regularization; Backpropagation; Batch / SGD.

**Visualization potential (aids understanding).** In 2-D parameter space with \(n=1\) or 2 constraints: the affine line/plane of interpolators, the min-norm point (perpendicular from origin), and a GD path from 0 along that perpendicular. **This is the picture that makes `linalg.ts` dual formula make sense.** High value, low decoration risk.

**Interactive experiment potential.** (1) **Cheap, high yield:** 2-parameter, 1-example least squares; student sees the interpolating line and the min-norm point; start GD from 0 vs from a far initialization (different interpolator if started off the origin’s row space — actually, GD from a nonzero init converges to the interpolator *closest to the init*; show that). (2) **Defer:** SGD vs Adam on a tiny net for implicit-bias differences. (3) Coefficient-norm vs degree on the existing sweep (Belkin-style), once numerics are stable.

**Existing coverage.** The dual-path min-norm solve *is* this theory’s least-squares special case, unnamed. SGD dynamics: absent.

---

## 6. Build priority

Weighing **educational payoff** against **implementation cost**, given that the engine is polynomial min-norm least squares + Recharts, and that audit Stage 5 wants a second module that **reuses** that engine. “High leverage” = many other lessons become teachable once this one exists.

### Tier 1 — must-have

| Concept | Justification |
| --- | --- |
| **Linear Regression** | Highest leverage *and* lowest cost: it is already the engine, unnamed. Every later regression experiment is this model. |
| **Loss Function** | Names what the y-axis already is (MSE). Prerequisite for GD, regularization, interpolation (“train loss ≈ 0”). Cheap: relabel + one residual-loss widget. |
| **Training / Validation / Test split** | Highest-leverage *hygiene* concept; 80/20 already implemented. Add a validation slice and a “peeking” demo. Unlocks honest hyperparameter lessons. |
| **Overfitting** (extend card) | Already taught; expand into a full lesson so it does not collide with double descent (“overfit ≠ interpolate”). |
| **Underfitting** (promote note → lesson) | The left half of the existing chart has no lesson. Cheap; pairs with overfitting. |
| **Generalization** | The product’s actual topic, currently implicit. Cheap labeling + gap vs absolute error. |
| **Function, Vector, Matrix** (concept pages; Math agent owns math) | High-leverage prerequisites for the engine’s own \(p\) vs \(n\) story. Cheap if kept conceptual. |
| **Gradient + Gradient Descent + Learning Rate** | One combined “first optimizer” module. Medium cost (new iterative solver) but unlocks logistic, SGD, backprop, and the min-norm-from-GD story. Highest-payoff *new* interactive after the split lesson. |
| **Bias–Variance tradeoff** | The classical theory the flagship module revises. Medium cost (multi-seed overlay) but reuses the regression engine; audit’s suggested second-module neighbor. |
| **Regularization** | Lowest-cost *true* second experiment: \(\lambda\) is already in `linalg.ts`. Directly interprets min-norm as \(\lambda \to 0\). |
| **Interpolation Threshold** (extend) | Flagship x-axis landmark; fix detector vs hint (audit P7) as part of extending, not as a new topic. |
| **Double Descent** (extend, do not rebuild) | Flagship. After the classical vocabulary exists, add min-norm / coefficient-norm and stop claiming DD on blown-up curves (audit P2–P3). |

### Tier 2 — valuable

| Concept | Justification |
| --- | --- |
| **Classification + Logistic Regression** | Needed for a well-rounded curriculum and for the max-margin implicit-bias story; new model class (medium–high cost). Teach after GD exists. |
| **Optimization** (named wrapping lesson) | Short conceptual glue once GD and closed-form LS both exist. Cheap if not a separate engine. |
| **Partial Derivative + Chain Rule** (Math agent) | Required before backprop; concept-level pages only until a net exists. |
| **Batch / Mini-batch / SGD** | Natural second optimizer lesson; needs GD. Medium cost, high clarity payoff. |
| **Activation Functions** | Cheap visualizations; prerequisite to a tiny-net / XOR demo. |
| **Backpropagation** | High educational payoff once a 1-hidden-layer net exists; implementation cost is the net, not the essay. |
| **Overparameterized optimization (min-norm picture)** | Cheap 2-D interpolator geometry; should ship as a coda to Linear Regression / Double Descent rather than waiting for a full “advanced theory” module. |

### Tier 3 — defer

| Concept | Justification |
| --- | --- |
| **Modern generalization theory as a full module** | Easy to get wrong; Zhang-scale demos are expensive. Ship a one-page “reading / coda” on the DD lesson first (Zhang random labels; Bartlett benign overfitting; Hastie ridgeless). |
| **Epoch-wise double descent / “more data hurts”** | Requires sweeping EMC (training time, \(n\)) on a model that interpolates via SGD (Nakkiran). The closed-form polynomial sweep cannot show epoch-wise DD. |
| **SGD implicit bias in deep nets** | Science is incomplete; demos easily overclaim. After a tiny-net module exists, revisit. |
| **Benign-overfitting covariance-spectrum lab** | High conceptual value but `NEEDS VERIFICATION` that a browser-scale linear toy actually shows Bartlett’s contrast. |
| **Full neural-net curriculum** (CNNs, etc.) | Out of scope for this concept list; activations + backprop on a tiny MLP are the cap of v2’s training track. |

**Suggested build sequence (content, not architecture):**  
(1) Name Linear Regression, Loss, Split, Underfit, Overfit, Generalization on top of the existing experiment.  
(2) Regularization path + Bias–Variance multi-seed — second *module*, same engine.  
(3) GD + learning rate (+ min-norm-from-zero picture).  
(4) Deepen Interpolation / Double Descent with coefficient norms and honest verdicts.  
(5) Classification / logistic.  
(6) SGD, activations, tiny-net backprop.  
(7) Theory coda; Nakkiran-style EMC experiments only if a neural trainer exists.

---

## 7. Common student misconceptions

Focused on **Tier 1** concepts. Flagged items are ones this agent is not confident are the *dominant* classroom error (they may still be real).

### Linear Regression

- **“Linear regression can only fit straight lines.”** False: linear in \(w\), not in \(x\). The entire existing lab is the counterexample (polynomial / Chebyshev features).
- **“A good fit on the training scatter means the model is correct.”** Ignores test error and the unknown \(f\).
- **`NEEDS VERIFICATION` as a dominant error:** confusing the intercept with “bias” in the bias–variance sense (terminology collision is real; frequency is unknown).

### Loss Function

- **“The loss is the same thing as accuracy”** (or as “how good the model is” on unseen data). Train loss is the optimizer’s score; test metrics can differ (especially 0–1 vs cross-entropy).
- **“Lower training loss is always better.”** Directly contradicted by overfitting and by Zhang et al. (2017) random-label interpolation.

### Training / Validation / Test

- **Using the test set to choose degree, \(\lambda\), or early-stopping epoch.** The existing UI invites this: students can stare at test error while selecting complexity. The cheat-toggle lesson should make this visceral.
- **“Validation and test are two names for the holdout.”** The point of three-way splits.
- **`NEEDS VERIFICATION`:** how often students think a random shuffle is always valid (time series / leakage). Important in industry; maybe less so on this synthetic 1-D lab.

### Overfitting / Underfitting / Generalization

- **“Overfitting means too many parameters.”** Incomplete: interpolating overparameterized models can generalize (Belkin; Zhang; Bartlett). Teach: overfitting is about **test performance**, not \(p > n\).
- **“Zero training error means the model is bad.”** Textbook claim Belkin et al. (2019) quote in order to revise it. The existing interpolation card already softens this; the overfitting card does not yet.
- **“A small train–test gap means the model generalizes well.”** Underfitters also have a small gap.
- **“More data always helps.”** Usually true in the classical regime; Nakkiran et al. document exceptions near the interpolation peak. Do not lead with the exception; do not deny it in the DD lesson. How often beginners hold the absolute “always” is `NEEDS VERIFICATION`.

### Gradient Descent / Learning Rate

- **“Gradient descent always finds the global minimum.”** True for typical least-squares linear models (convex quadratic); false in general. Teach on a convex example first, then show a counterexample.
- **“Follow the gradient”** (wrong sign). The update is **minus** \(\eta \nabla L\).
- **“Larger learning rate is always faster.”** Divergence / oscillation.
- **“The closed-form solution is not machine learning; GD is.”** Status snobbery; show they can agree.

### Bias–Variance

- **Statistical bias = social/ethical bias.** Different words. Say so explicitly.
- **“We can drive bias and variance both to zero and beat the noise.”** Irreducible \(\sigma^2\) remains for squared loss.
- **“The U-curve is the complete theory of complexity.”** The reason this site exists. Teach the U-curve as **the underparameterized chapter**, not as a law of nature.

### Regularization

- **“Ridge sets coefficients to exactly zero.”** That is the Lasso’s selling point, not ridge’s.
- **“Regularization always improves test error.”** Too-large \(\lambda\) underfits. Zhang et al.: explicit regularizers are not the fundamental explanation of deep-net generalization.
- **Ignoring that min-norm interpolation *is* a (limiting) regularizer.** The silent `RIDGE` and the dual LS formula.

### Interpolation threshold / Double descent (flagship)

- **“The interpolation threshold is the best model.”** It is often the **worst** local region of test error (Belkin; the existing card says test error often *peaks* there).
- **“Double descent always happens if you go far enough.”** The existing copy is correctly hedged; the detector is not (audit P2). Teach: absence is an allowed outcome.
- **“Double descent means overfitting isn’t real.”** The classical overfit peak is still there; the sequel is about *which interpolator*.
- **`NEEDS VERIFICATION`:** students equating interpolation with “the model passed through every test point” (they mix train interpolation with test). Plausible; not documented here.

### Gradient / Backprop (for when Tier 2 ships)

- **“Backprop is the optimizer.”** It is the gradient algorithm; SGD/GD is the update.
- **“ReLU is linear, so a ReLU net is linear.”** Piecewise linear ≠ one linear map.

---

## 8. Sources

Textbook-level (Foundations, Math concept statements, Loss, GD update, logistic loss, SGD sequential update):

- C. M. Bishop, *Pattern Recognition and Machine Learning* (2006), especially Ch. 3 (linear regression, least squares, sequential GD), Ch. 4 (logistic regression, cross-entropy), Ch. 5 (GD, backpropagation).
- T. Hastie, R. Tibshirani, J. Friedman, *The Elements of Statistical Learning*, Ch. 7 (bias–variance decomposition for squared loss).
- I. Goodfellow, Y. Bengio, A. Courville, *Deep Learning* (2016), Ch. 6 (activations, MLP) — used only for qualitative activation discussion.

Advanced (non-obvious claims):

- M. Belkin, D. Hsu, S. Ma, S. Mandal, “Reconciling modern machine-learning practice and the classical bias–variance trade-off,” *PNAS* 116(32), 2019. [doi:10.1073/pnas.1903070116](https://doi.org/10.1073/pnas.1903070116) / arXiv:1812.11118.
- P. Nakkiran, G. Kaplun, Y. Bansal, T. Yang, B. Barak, I. Sutskever, “Deep Double Descent: Where Bigger Models and More Data Hurt,” arXiv:1912.02292 (2019); *J. Stat. Mech.* (2021) 124003. EMC definition, epoch-wise DD, sample non-monotonicity.
- C. Zhang, S. Bengio, M. Hardt, B. Recht, O. Vinyals, “Understanding deep learning requires rethinking generalization,” ICLR 2017, arXiv:1611.03530.
- P. L. Bartlett, P. M. Long, G. Lugosi, A. Tsigler, “Benign overfitting in linear regression,” *PNAS* 117(48), 2020. [doi:10.1073/pnas.1907378117](https://doi.org/10.1073/pnas.1907378117).
- T. Hastie, A. Montanari, S. Rosset, R. J. Tibshirani, “Surprises in high-dimensional ridgeless least squares interpolation,” *Annals of Statistics* 50(2), 2022. [doi:10.1214/21-AOS2133](https://doi.org/10.1214/21-aos2133) / arXiv:1903.08560.
- D. Soudry, E. Hoffer, M. S. Nacson, S. Gunasekar, N. Srebro, “The Implicit Bias of Gradient Descent on Separable Data,” *JMLR* 19(70), 2018.
- D. E. Rumelhart, G. E. Hinton, R. J. Williams, “Learning representations by back-propagating errors,” *Nature* 323:533–536, 1986.

Internal:

- `docs/phase0-project-audit.md` — architecture, existing coverage, P2/P3/P7 numerics issues.
- `src/lib/i18n.ts` concept cards; `src/lib/linalg.ts` min-norm / ridge; `src/lib/metrics.ts` MSE and generalization gap.

---

## 9. Log of every `NEEDS VERIFICATION` mark in this document

1. **Student calculus background** for Partial Derivative (whether a 1-D derivative primer is required).
2. **Historical one-liner for backpropagation priority** (Werbos vs Rumelhart et al. 1986) for student-facing citation.
3. **Linear scaling rule** \(\eta \propto\) batch size as a general fact — not to be taught as a theorem for this site’s models (Goyal et al. is ImageNet-scale practice).
4. **Default width/seed for a ReLU XOR demo** reliably succeeding in-browser.
5. **Bias–variance-style decomposition for 0–1 loss** as a teaching default (squared-loss decomposition is solid; 0–1 is not the same formula).
6. ~~**Empirical bias/variance sweep** on the current Chebyshev engine remaining numerically stable at high degree~~ — **[RESOLVED 2026-08-28] for the capped regime.** Safe at \(n_{\text{train}}=40\), \(d\le12\): \(\kappa(\mathbf{X})\lesssim2\), \(\lVert\theta\rVert_2\le0.73\). The bias–variance lab is viable under that cap, which must be enforced in code. **Not** safe at \(d\gtrsim40\) with \(n=80\) (§4.3).
7. ### 🚫 **BLOCKING — OPEN. Whether the existing estimator + dataset can produce genuine double descent (`secondMin < firstMin`) for any reachable config.**
   **This is the central scientific question of the product and it is NOT settled.** It was not settled by the newly adopted defaults; if anything those made it worse. At `datasetSize=50`, `noise=1.0`, `maxComplexity=320`, `analyzeDoubleDescent` returns the **strictest `"Clear Double Descent"` tier** on a curve **peaking at \(4.88\times10^{6}\) test MSE at degree 30**, with the interpolation threshold misreported as **51** against a theoretical **39**. That is the original dishonest-verdict defect returning in its most severe form. Full evidence — including the non-noise-aware `1e-3` cutoff, the knife-edge "threshold = 79" agreement, and the 10-point test set whose expected MSE cannot fall below \(\sigma^2=1\) — is recorded in `docs/phase2-synthesis.md`.
   **Consequence: no lesson prose about double descent may be authored, and no lesson may promise a second descent, until this is settled.** A separate engineering investigation is in flight on exactly this. Nothing in this document licenses writing L14 copy before it lands.
8. **Nakkiran EMC \(\varepsilon = 0.1\)** as a portable constant (authors call it heuristic).
9. **Tiny in-browser net fitting random labels** as a fair Zhang-style demo.
10. **Benign-overfitting covariance toy** actually displaying Bartlett’s contrast at browser scale.
11. **“SGD ≈ implicit L2” for deep nets** as a universal statement — treat as unverified / not a theorem.
12. **Misconception frequency:** intercept vs statistical “bias”; shuffle-split always valid; “more data always helps” as a beginner belief; train-interpolation confused with fitting test points.

Related audit items (not re-investigated here, still open): root cause of high-degree test-MSE blow-up; whether Jacobi fallback is correct and used; calibration of `DD_THRESHOLDS`; noise-unaware `1e-3` interpolation cutoff.
