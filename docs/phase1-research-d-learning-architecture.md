# Phase 1 — Research D: Learning Architecture

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Branch:** `ml-platform-v2`
**Date:** 2026-08-28
**Role:** educational architecture only. No source was modified except this document.
**Inputs:** `docs/phase0-project-audit.md`, `src/lib/i18n.ts` (418-line bilingual `en`/`ko` blob), `src/types/experiment.ts`, `src/app/page.tsx`, Next.js 16.3.3 App Router docs under `node_modules/next/dist/docs/`.

This document designs the site as a **course**, not an encyclopedia. A student who lands on it should know where to start, and each concept should make the next one feel necessary.

---

## 0. Constraints inherited from the audit

These facts constrain every recommendation below.

- The product is a **single route** (`/`) with hash anchors (`#top`, `#experiments`, `#concepts`, `#about`). There is no `Lesson` entity, no content registry, no dynamic segment, no `generateStaticParams`, no `generateMetadata` beyond the root layout.
- The only ML topic is **double descent in polynomial regression**. `ExperimentSummaryData.doubleDescentStatus` is hardcoded into the domain model. Three concept cards (overfitting, interpolation threshold, double descent) are static copy in `i18n.ts`, not lessons.
- All learner-facing prose is bilingual English/Korean, currently in one client-loaded file (`src/lib/i18n.ts`). Locale lives in `localStorage` (`ai-research-lab.locale`) and is applied after hydration — Korean users see English on first paint.
- Experiment history is `localStorage` key `ai-research-lab.history.v1`: named `v1` but **unvalidated and without a migration function** (audit T10 / S2).
- Next.js **16.3.3**, App Router, Turbopack default. Pages and layouts default to Server Components. `params` and `searchParams` are **async** (`Promise<…>`). `middleware.ts` is now `proxy.ts`. `<html>` must set `data-scroll-behavior="smooth"` if CSS uses smooth scrolling, or multi-route navigation will feel wrong (audit §1.2).
- The app is statically prerendered today (`○` in the build) but does **not** set `output: 'export'` in `next.config.ts`. There is no backend and no accounts.

---

## 1. Curriculum graph

### 1.1 Design stance: a story, not a topic dump

The driving question of the course:

> How does a machine fit a pattern from examples — and why does “more complexity” sometimes help and sometimes hurt?

Every node exists because the previous node creates a problem the next node solves. “Mathematical foundations” is **not** a single wall-of-calculus lesson at the front. Calculus appears when loss minimization makes it necessary. Neural nets appear after the student already understands fitting, generalization, and complexity on a model they can plot (polynomials) — which is also the model the existing lab actually implements.

That last point is the load-bearing ordering decision. The live experiment is polynomial regression, not a neural net. Putting neural networks and backpropagation *before* generalization would force every visitor through material the flagship lab does not use, and would strand the existing module as an unexplained appendix.

### 1.2 Canonical node list (18 lessons)

> ### 📌 **[VERIFIED 2026-08-28] THIS SECTION IS AUTHORITATIVE FOR CURRICULUM ORDER.**
>
> Research B §17 has been **demoted** to a *mathematical dependency graph* — a statement of which piece of mathematics presupposes which, useful for checking that no lesson uses an undefined object. It is **not** a shipping order and B now says so explicitly. Where B §17's linearization and this section disagree, **this section wins.**
>
> **[CORRECTED 2026-08-28] Two nodes were missing and have been added: `normal-equations` and `conditioning`.** Research B correctly identifies both as load-bearing, and the omission of `conditioning` was significant: conditioning is the *actual explanation* of the flagship module's behaviour, so without it the capstone lesson has no mechanism to offer, only a phenomenon. They are inserted at 9a and 13a below to avoid renumbering this document mid-audit; when `curriculum.ts` is written, renumber `order` to a contiguous 1…18 in the sequence shown.

IDs are URL slugs. Difficulty: `intro` | `core` | `advanced`. Times are wall-clock estimates for a motivated high-school / early-undergrad student following the eight-stage lesson template, including the experiment when one exists. They are planning numbers, not measurements.

**NEEDS VERIFICATION** — study-time estimates have not been piloted with real students. Treat them as relative weights (short / medium / long) until a first cohort is timed.

**NEEDS VERIFICATION** — audience math background is inferred from the bilingual student-facing copy and the polynomial-regression lab, not from a stated HAFS syllabus. If the cohort already has multivariable calculus, L05–L07 can be compressed; if they do not, those three lessons are load-bearing and must not be skipped on the rigorous path.

| # | slug | Title | Diff. | Min. | Exp? | Hard prerequisites | Unlocks (hard) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `functions-and-parameters` | Functions, parameters, and what a model is | intro | 25 | no | — | `linear-regression` |
| 2 | `linear-regression` | Linear regression | intro | 40 | yes | `functions-and-parameters` | `loss-function`, `polynomial-regression` |
| 3 | `loss-function` | Loss functions (MSE) | intro | 35 | yes | `linear-regression` | `derivative`, `generalization` |
| 4 | `polynomial-regression` | Polynomial regression and model complexity | intro | 40 | yes | `linear-regression` | `overfitting` |
| 5 | `derivative` | Derivative as slope of the loss | core | 45 | yes | `loss-function` | `partial-derivative` |
| 6 | `partial-derivative` | Partial derivatives | core | 35 | yes | `derivative` | `gradient` |
| 7 | `gradient` | The gradient | core | 40 | yes | `partial-derivative` | `gradient-descent`, `backpropagation` |
| 8 | `gradient-descent` | Gradient descent | core | 50 | yes | `gradient` | `optimization`, `neural-network` |
| 9 | `optimization` | Optimization landscapes | core | 40 | yes | `gradient-descent` | — (enriches NN; not a hard gate) |
| **9a** | `normal-equations` | **[ADDED]** Normal equations: the same problem, solved in closed form | core | 35 | yes | `optimization`, `polynomial-regression` | `conditioning` |
| 10 | `generalization` | Train, test, and generalization | intro | 35 | yes | `loss-function` | `overfitting` |
| 11 | `overfitting` | Overfitting and underfitting | core | 40 | yes | `polynomial-regression`, `generalization` | `regularization`, `interpolation-threshold`, `neural-network` (recommended) |
| 12 | `regularization` | Regularization | core | 40 | yes | `overfitting` | — (recommended before double descent) |
| 13 | `interpolation-threshold` | Interpolation threshold | core | 30 | yes | `overfitting` | `double-descent` |
| **13a** | `conditioning` | **[ADDED]** Conditioning: why a correct formula can still explode | advanced | 35 | yes | `normal-equations`, `interpolation-threshold` | `double-descent` |
| 14 | `double-descent` | Double descent | advanced | 50 | yes | `interpolation-threshold`, `conditioning` | — (capstone of the complexity arc) |
| 15 | `neural-network` | Neural networks | advanced | 55 | yes | `gradient-descent` | `backpropagation` |
| 16 | `backpropagation` | Backpropagation | advanced | 55 | yes | `neural-network`, `gradient` | — |

**[CORRECTED 2026-08-28] Why the two new nodes sit where they do.**

- **`normal-equations` (9a).** It is placed immediately after `optimization` because that is the first point at which the student has everything the derivation needs: a loss, a gradient, and the idea that "minimize" means "set the gradient to zero." It is placed *after* `polynomial-regression` rather than before because polynomial regression is where the student first meets a design matrix with more than two columns. Its job is the contrast Research B §11.7 names: **gradient descent and the normal equations are two solvers for the same \(J\)** — and the shipped engine uses the second one. Without this node, every experiment in the generalize-act is powered by a solver the course never explained. Hard prerequisites: `optimization`, `polynomial-regression`.
- **`conditioning` (13a).** It is placed between `interpolation-threshold` and `double-descent` because that is exactly where the student first sees numbers that a mathematically correct formula cannot justify. **This is the actual explanation of the flagship module's behaviour** (Research B §16, §16.5a): \(\kappa\) is flat for Chebyshev + arcsine to \(d\approx20\), then accelerates as \(p\to n\); the relative ridge floors it at \(\approx4.6\times10^{8}\); beyond \(d\approx78\) the printed condition numbers are not meaningful digits. A `double-descent` lesson that cannot say which part of the curve is physics and which part is float64 is not honest. Hard prerequisites: `normal-equations`, `interpolation-threshold`. It is `advanced` and sits on the `rigorous` and `double-descent` paths; the `intuition` path may take it with `mathematics` / `derivation` hidden.

**Existing module placement:** `double-descent` is node 14 of 16 — near the **end** of the complexity/generalization arc, and *before* neural nets. The three current concept cards map onto nodes 11, 13, and 14. The current `ExperimentWorkspace` is the Experiment stage of node 14.

> ### ⚠ **[CORRECTED 2026-08-28] The reuse plan for nodes 4, 11 and 12 must change. "Same sweep, different framing, hide the DD verdict" is not sufficient.**
>
> This document proposed reusing the double-descent sweep for nodes 4 (`polynomial-regression`), 11 (`overfitting`) and 12 (`regularization`) with a different framing and the DD verdict hidden. **The framing is not the problem — the curve is.** At the old defaults the shipped sweep still peaks at **\(6.1\times10^{4}\) test MSE**. Hiding the verdict on a chart that climbs five orders of magnitude teaches a beginner that overfitting means numerical detonation. It does not.
>
> **Nodes 4, 11 and 12 must instead use Research C's capped cubic experiment definition** (C §4.2): a **different ground truth** (\(f(x)=0.2T_1(x)+0.7T_3(x)\)), a **hard degree cap of 12**, enforced in code, and **no `analyzeDoubleDescent` call at all**. That is a distinct experiment definition, not a re-skinned DD config.
>
> **Node 13 (`interpolation-threshold`) may keep the DD workspace** — interpolation is genuinely what that sweep is about — subject to §5.2's blocking fix. Node 13a (`conditioning`) also uses the DD workspace, since the ill-conditioning it explains only appears there. Node 14 keeps it by definition.
>
> Practical consequence for the schema: nodes 4/11/12 point at a **different `experimentId`** from nodes 13/13a/14. See §3.3 gap (a).

See §1.6 for the “only content is the last lesson” problem.

Polynomial regression is **not** in the prompt’s topic list. It is added on purpose: it is the concrete model class of the shipped lab, it is the cleanest place to introduce “complexity” as a knob, and it lets overfitting / interpolation / double descent be *seen* rather than described.

### 1.3 Why this order (and what I refused to copy)

The prompt’s seed list was:

> mathematical foundations → linear regression → loss → derivative → partial → gradient → gradient descent → optimization → neural network → backpropagation → generalization → overfitting → regularization → double descent

Deviations, with reasons:

1. **“Mathematical foundations” is split, not front-loaded.** A single foundations lesson becomes an encyclopedia. L01 is only “a model is a parameterized function.” Calculus (L05–L07) is delayed until the student has a loss they actually want to minimize. Linear algebra stays a sidebar inside linear regression (vectors as lists of numbers; “the computer solves a system”), not a prerequisite course. The existing engine’s Gaussian elimination / Chebyshev basis is an implementation detail, not a learning objective.

2. **Polynomial regression is inserted immediately after linear regression**, before calculus. Fitting a degree-*d* polynomial does not require derivatives (the lab already uses closed-form min-norm least squares). Putting the complexity knob in the student’s hand *before* the optimization arc means overfitting later is a plot they have already seen, not a new abstraction.

3. **Generalization / overfitting / regularization / interpolation / double descent come before neural networks.** Two reasons. (a) The flagship experiment is polynomial, so the punchline must be reachable without a net. (b) Pedagogically, the classical U-shape has to be believed before double descent can surprise anyone. Neural nets are then “the same story on a more powerful model class,” not a prerequisite for the story.

4. **Regularization is recommended-before, not hard-required-for, double descent.** The classical “penalize complexity” fix should be in the student’s vocabulary so min-norm / implicit regularization in the overparameterized regime has something to contrast with. The targeted path may skip it with a warning. Hard-requiring it would block the visitor who came only for the lab.

5. **Backpropagation requires `gradient`, not merely `neural-network`.** A student who understands stacked linear maps but not gradients cannot follow a derivation of backprop. The intuition path therefore does not include L16.

6. **Optimization is its own lesson after gradient descent**, covering learning rate, convexity vs. non-convexity, and local minima — the questions GD itself raises. It is not a synonym for GD and it is not a hard gate for later nodes.

### 1.4 Motivation chain (why each node earns the next)

```
L01  A model is f(x; θ). What is the simplest useful f?
L02  A line. How do we score a fit?
L03  Loss (MSE). We have a number. Two forks:
       → How do we minimize it when there is no closed form?     (L05–L09)
       → Does a small training loss mean the model is good?      (L10)
L04  The line is too simple. Raise the degree. Complexity is now a knob.
L05  In one parameter, loss vs. θ is a curve. Slope says which way is downhill.
L06  Real models have many parameters. Hold the others fixed.
L07  Bundle the partials into one arrow: the gradient.
L08  Walk against the arrow. That is training.
L09  Step size, valleys, saddle points — training can fail.
L10  Training loss is not the goal. New data is.
L11  Too simple: underfit. Too flexible: overfit. The U-shape.
L12  Classical fix: penalize complexity (ridge — the engine already has a ridge).
L13  What if we fit the training set *perfectly*? The interpolation peak.
L14  Past that peak, test error can fall again. Double descent. (existing lab)
L15  Polynomials are one model class. Stacked linear maps + nonlinearity scale further.
L16  Efficient gradients for that stack: backpropagation.
```

### 1.5 DAG verification

Hard-prerequisite edges only (`A → B` means “A is a hard prerequisite of B”):

```
functions-and-parameters → linear-regression
linear-regression        → loss-function
linear-regression        → polynomial-regression
loss-function            → derivative
loss-function            → generalization
derivative               → partial-derivative
partial-derivative       → gradient
gradient                 → gradient-descent
gradient                 → backpropagation
gradient-descent         → optimization
gradient-descent         → neural-network
optimization             → normal-equations        // [ADDED 2026-08-28]
polynomial-regression    → normal-equations        // [ADDED 2026-08-28]
polynomial-regression    → overfitting
generalization           → overfitting
overfitting              → regularization
overfitting              → interpolation-threshold
normal-equations         → conditioning            // [ADDED 2026-08-28]
interpolation-threshold  → conditioning            // [ADDED 2026-08-28]
interpolation-threshold  → double-descent
conditioning             → double-descent          // [ADDED 2026-08-28]
neural-network           → backpropagation
```

Recommended (soft) edges, **not** in the DAG and not used for cycle checking:

```
regularization  ⇢ double-descent
overfitting     ⇢ neural-network
optimization    ⇢ neural-network
```

**Cycle check.** Every hard edge points to a strictly higher canonical index except `gradient → backpropagation` (7 → 16) and `gradient-descent → neural-network` (8 → 15), which skip forward, and none point backward. **[VERIFIED 2026-08-28]** the two added nodes preserve this: `normal-equations` (9a) has prerequisites at 9 and 4, `conditioning` (13a) has prerequisites at 9a and 13, and both of `conditioning`'s dependents are at 14. A topological order exists and equals the canonical numbering 1…9, 9a, 10…13, 13a, 14…16. Therefore the hard-prerequisite graph is still a DAG.

In-code enforcement (migration stage, not now): a `selfcheck` (or later Vitest) assertion that (a) every `prerequisites` slug exists, (b) Kahn’s algorithm succeeds, (c) no node lists itself.

### 1.6 The tension: the site’s only content is the last lesson

**What a visitor sees today.** They land on `/`. The hero CTA is “Start Experiment.” The workspace is the double-descent sweep. Three concept cards below the fold (overfitting, interpolation threshold, double descent) assume vocabulary the page never taught. There is no “start here,” no path, no previous lesson. The product currently *is* the capstone, with a glossary taped underneath.

That is a real conflict, not a routing inconvenience. Double descent is pedagogically last because it *refutes* the classical U-shape the student is supposed to hold. Serving it first means the surprise has nothing to surprise.

**How we get them to the right starting point without hiding the lab.**

Do not 404 the experiment. Do not hard-gate it. Do three things at once:

1. **Home becomes a course lobby, not the lab.** Primary CTA: “Start the course” → L01 (or resume; see §4.6). Secondary CTA: “I came for the double-descent lab” → `/[lang]/learn/double-descent`. The existing experiment stays one click from the first screen during and after migration.
2. **`double-descent` carries a 2-minute prerequisite briefing** (overfitting U-shape + interpolation peak + “this lab reports only what the run shows”) so a cold visitor can run the experiment honestly. The briefing links to L11 and L13 for the full treatment. This is a *stage* on that lesson (`concept` / `connection` compressed), not a popup paywall.
3. **Canonical URL of the workspace moves to the lesson**, with redirects from `/#experiments` and (during a deprecation window) from `/` so bookmarks and the current README still work. See §6.

The lab remains the product’s proof of honesty. The course is how a new student earns it.

---

## 2. Learning paths

A path is an ordered subsequence of the DAG, not a second graph. The UI stores `activePathId` so prev/next follow the path, not the canonical index. A student may leave a path at any time; the map still shows the full DAG.

### 2.1 Path `rigorous` — full course (default)

Audience: student who wants the whole argument, including calculus and neural nets.

```
functions-and-parameters
→ linear-regression
→ loss-function
→ polynomial-regression
→ derivative
→ partial-derivative
→ gradient
→ gradient-descent
→ optimization
→ normal-equations          // [ADDED 2026-08-28]
→ generalization
→ overfitting
→ regularization
→ interpolation-threshold
→ conditioning              // [ADDED 2026-08-28]
→ double-descent
→ neural-network
→ backpropagation
```

Estimated **~11–13 hours** (**[CORRECTED]** raised from ~10–12 by the two added nodes, 35 min each). Prev/next is this sequence. Soft edges are included (regularization before double descent; optimization before neural nets).

### 2.2 Path `intuition` — math-light, experiment-heavy

Audience: student who will believe a contour plot and a moving ball, but will bounce off symbolic partials.

```
functions-and-parameters
→ linear-regression
→ loss-function
→ polynomial-regression
→ generalization
→ overfitting
→ regularization
→ interpolation-threshold
→ double-descent
```

Optional appendix, not in the path’s prev/next: a single capsule “downhill without derivatives” that may later live as a shortened `gradient-descent` with stages `mathematics` and `derivation` hidden.

Skipped on purpose: L05–L09 and L15–L16. The eight-stage template still runs; those lessons simply omit or stub the `mathematics` / `derivation` stages (see `LessonStage.optional` in §3). Estimated **~5–6 hours**.

**NEEDS VERIFICATION** — whether skipping all of calculus still leaves double descent intelligible. The briefing on L14 plus the polynomial sweep may be enough; it may also produce a cargo-cult reading (“error went down again”). First-cohort observation should decide whether a 15-minute numeric-slope interlude is required on this path.

### 2.3 Path `double-descent` — targeted

Audience: visitor who opened the site because of the lab.

```
polynomial-regression     // complexity knob; 15–20 min, not the full L04 if a “fast” variant is authored
→ generalization
→ overfitting
→ interpolation-threshold
→ double-descent
```

Optional sidebar, not in prev/next: `regularization`. **[ADDED 2026-08-28]** `conditioning` (13a) is also a sidebar on this path rather than a required step — a targeted visitor should not be blocked by it, but the `double-descent` lesson must be able to link to it the moment the curve does something float64 is responsible for.

This path is valid on the DAG: `polynomial-regression` has a hard prereq of `linear-regression`, which has a hard prereq of `functions-and-parameters`. For this path we **warn, do not block**, and inject a 5-minute “what is a model / what is a line / what is MSE” callout at the top of `polynomial-regression` when `activePathId === "double-descent"`. Estimated **~2.5–3.5 hours**, or ~50 minutes if they skip straight to L14 and only read the briefing.

### 2.4 Path `optimization` — training mechanics

Audience: student who wants to understand *how* models are fit, and may not care about double descent yet.

```
functions-and-parameters
→ linear-regression
→ loss-function
→ derivative
→ partial-derivative
→ gradient
→ gradient-descent
→ optimization
→ neural-network
→ backpropagation
```

`polynomial-regression` is recommended between loss and derivative (same complexity-knob argument) but not required for this path’s goal. Estimated **~7–8 hours**.

---

## 3. Content model

### 3.1 Entities

- **Course** — one, for now: this ML sequence. Future courses (e.g. a statistics track) would be siblings, not nested inside lessons.
- **Path** — named route through the lesson graph (`rigorous` | `intuition` | `double-descent` | `optimization`).
- **Lesson** — one concept. One URL. Eight *stages* internally, not eight URLs.
- **Stage** — one of the eight pedagogical moves. Some may be omitted.
- **ExperimentDefinition** — topic-agnostic runner (audit R1). Referenced by `experimentId`, not inlined in lesson prose. The current double-descent workspace is the first implementation.
- **UI chrome dictionary** — buttons, nav, errors, verdicts. Not lesson prose.

Lessons do **not** own `doubleDescentStatus`. That field stays on the experiment result type, behind the experiment abstraction.

### 3.2 Eight-stage lesson shape

Intended flow inside every concept:

**Concept → Intuition → Mathematics → Derivation → Experiment → Visualization → Application → Connection**

| Stage | Job | Typical media |
| --- | --- | --- |
| `concept` | Name the idea in one plain-language claim. What problem from the previous lesson this solves. | Prose |
| `intuition` | Metaphor, picture, or numeric toy *before* symbols. | Prose + diagram |
| `mathematics` | The objects and notation. Definitions, not proofs. | Prose + KaTeX |
| `derivation` | Why the formula looks that way. Skippable on `intuition` path. | Prose + KaTeX |
| `experiment` | The student changes a knob and the claim is at risk of being false. | Client island |
| `visualization` | The plot or animation that makes the experiment legible. Often the same island. | Client island |
| `application` | One concrete use or failure mode in the wild. | Prose |
| `connection` | What this unlocks; explicit links to next lesson and related nodes. | Prose + links |

`experiment` and `visualization` collapse into one island when they are the same widget (true of the current lab). They remain two *pedagogical* stages so a lesson can show a canned figure without a runner, or a runner without a novel chart.

Stages are in-page sections with ids `#concept`, `#intuition`, … so the URL is stable (`/en/learn/overfitting#experiment`) and prev/next can deep-link into the next lesson’s `#concept`.

### 3.3 Schema (TypeScript-like pseudocode)

```ts
type Locale = "en" | "ko";
type Localized<T> = Record<Locale, T>;

type Difficulty = "intro" | "core" | "advanced";
type PathId = "rigorous" | "intuition" | "double-descent" | "optimization";

type StageId =
  | "concept"
  | "intuition"
  | "mathematics"
  | "derivation"
  | "experiment"
  | "visualization"
  | "application"
  | "connection";

/** Curriculum graph + SEO + routing. No long prose. Lives in TS. */
interface LessonMeta {
  slug: string;
  order: number; // canonical index 1..N
  difficulty: Difficulty;
  estimatedMinutes: number;
  hasExperiment: boolean;
  experimentId?: string; // key into ExperimentDefinition registry
  /**
   * [ADDED 2026-08-28] Per-lesson override of the experiment's defaultConfig().
   * Closes schema gap (a): see the note below this block.
   * `LessonMeta` is not generic, so the registry either parameterizes it as
   * LessonMeta<TConfig> or stores this as an unknown-shaped record that the
   * experiment definition validates. Do not let it be `any`.
   */
  experimentConfig?: Partial<TConfig>;
  prerequisites: string[]; // hard slugs
  recommendedPrerequisites: string[]; // soft slugs
  unlocks: string[]; // hard dependents (denormalized; generate from prereqs)
  related: string[]; // lateral links, not edges
  pathIds: PathId[]; // which paths include this node
  title: Localized<string>;
  summary: Localized<string>; // cards, map, generateMetadata
  /** If true, this lesson may render with mathematics/derivation hidden. */
  mathOptional: boolean;
}

interface PathMeta {
  id: PathId;
  title: Localized<string>;
  description: Localized<string>;
  slugs: string[]; // ordered subsequence
}

interface Curriculum {
  version: number; // bump when graph shape changes; stored beside progress
  lessons: LessonMeta[];
  paths: PathMeta[];
}

/**
 * Body of one stage in one locale. Authored as MDX.
 * Frontmatter is forbidden to disagree with LessonMeta; meta is the source of truth.
 */
interface LessonStageMdx {
  // filename: content/lessons/{slug}/{locale}/{stageId}.mdx
  // or a single {locale}.mdx with <Stage id="concept">…</Stage> sections
}

/** Runtime view model the page assembler builds. */
interface Lesson {
  meta: LessonMeta;
  stages: Array<{
    id: StageId;
    optional: boolean;
    title: Localized<string>;
    /**
     * Server-rendered MDX module for this locale.
     * May embed <Math>, <Experiment island={experimentId} />, <RelatedLink slug=… />.
     */
    Body: unknown; // MDXComponent
  }>;
}

/** Progress blob. Separate from experiment history. Versioned + validated. */
interface ProgressV1 {
  schemaVersion: 1;
  curriculumVersion: number;
  activePathId: PathId | null;
  lastLessonSlug: string | null;
  lastStageId: StageId | null;
  completedSlugs: string[];
  completedStages: Record<string, StageId[]>; // slug → stages marked done
  updatedAt: number;
}

/** UI chrome. Not lesson prose. JSON dictionaries, one file per locale, split by surface. */
interface ChromeDict {
  nav: { /* … */ };
  lesson: { prev: string; next: string; startHere: string; resume: string; /* … */ };
  prereqBanner: { missing: string; catchUp: string };
  // experiment chrome stays close to today's i18n.ts experiment.* keys
}
```

> ### **[CORRECTED 2026-08-28] Two `LessonMeta` / `ExperimentDefinition` schema gaps, now closed.**
>
> The two abstractions are otherwise **compatible**, and one design decision here is actively right and should be preserved: this document keeps `doubleDescentStatus` **off** `Lesson` and **on** the experiment result, which is exactly what Research C wants. Two gaps remained.
>
> **(a) A lesson cannot override the experiment's default config.** This document says the workspace is reused with different default configs, but `LessonMeta` carried only a single `experimentId` and no override, while in Research C §11.1 `defaultConfig()` belongs to the *definition*, not the lesson. There are two ways to close this:
>
> - register **distinct definition ids** (one per configuration), or
> - add an **override field** on `LessonMeta`.
>
> **Recommendation: the override field.** `experimentConfig?: Partial<TConfig>` has been added to `LessonMeta` above. It keeps one definition per *algorithm* rather than one per *lesson*, so the acceptance tests, guards and analysis predicates are written and verified once. Distinct ids are still the right call when the lesson needs a genuinely different **definition** — different ground truth, different guards, no `analyzeDoubleDescent`. Per §1.2, nodes 4/11/12 are exactly that case and get their **own definition id** (Research C's capped cubic), while `experimentConfig` handles the remaining per-lesson tuning.
>
> **(b) Locale must be passed into the experiment island explicitly.** Research C's contract is `analyze(result, locale) → string[]`, but this document resolves locale from the URL and server-renders prose. Written down explicitly so it cannot be missed: **the experiment client island receives `lang` as a prop** from the server component that renders it. It must not re-derive locale from context, `localStorage`, or a second provider. Without this, the audit's existing defect — *analysis notes computed twice, one copy in the wrong language* — is recreated inside the new abstraction, which is a worse outcome than leaving it where it is, because it would then be structural.

**Bilingual rule:** every `Localized<T>` field and every MDX body has both `en` and `ko`. A build-time check fails if a slug exists in one locale and not the other, or if stage files are missing. Interpolated strings (today’s `(deg, nTrain) => …` functions in `i18n.ts`) become either MDX components that take props, or chrome-dictionary functions kept in a small typed TS module — JSON cannot hold functions.

**Embedded math:** MDX + `remark-math` / `rehype-katex` (or equivalent). Display math belongs in `mathematics` and `derivation`; `intuition` should prefer pictures and numbers.

**Embedded experiments:** an MDX component such as `<Experiment id="double-descent" />` that renders a client island. The island is the only `"use client"` subtree on the page. Prose stays a Server Component.

### 3.4 Where content lives — options and recommendation

The site is statically prerendered Next.js 16, bilingual, and about to grow from one topic to sixteen lessons. Three places content could live:

| Option | What it is | Strengths | Weaknesses here |
| --- | --- | --- | --- |
| **A. Typed TS modules** (status quo scaled) | `content/lessons/overfitting.ts` exports `{ en, ko }` objects | Full typecheck; interpolating functions stay natural; no new toolchain | Audit T2 already hurts at 418 lines / one topic. Long prose in TS is unreadable. If any lesson module is imported from a Client Component, **all locales of all lessons** inflate the client bundle (audit R3). Math is strings. |
| **B. JSON** | Per-locale dictionaries, as in Next 16 i18n guide | Official pattern for chrome; dynamic `import()` so unused locales stay off the client when loaded from a Server Component | No JSX, so no embedded experiments. No markdown. Functions (today’s `interpolationHint`) cannot live in JSON. Sixteen bilingual lessons of eight stages each will be a large, untyped string soup. |
| **C. MDX-only** | Each lesson is `page.mdx` under `app/` | Prose + components in one file; `@next/mdx` is documented for App Router; Server Component compatible | Bilingual means either duplicated routes or duplicated files that drift. Graph metadata (prereqs, difficulty) does not belong in frontmatter scattered across 32 files — DAG validation becomes grep. MDX-as-route fights `generateStaticParams` over a registry. |
| **D. Hybrid (recommended)** | Typed `curriculum.ts` registry + per-locale MDX bodies + JSON chrome dictionaries | Graph is typechecked and DAG-testable. Prose is authored as prose. Experiments embed as components. Chrome follows Next’s dictionary pattern and can be `server-only`. Each lesson/locale is a separate module, so one page does not ship the whole course to the client. | Three formats to teach authors. MDX pipeline must be wired into Next 16 / Turbopack. Locale files can still drift (mitigated by the build check). |

**Recommendation: D.**

**Deciding reason:** the thing that must not be wrong is the *graph* (prerequisites, path membership, experiment ids); the thing that will dominate bytes and authoring time is *bilingual prose with math and widgets*. Those are different jobs. The current `i18n.ts` pattern fails both: it is untyped as a curriculum, and it is a client blob as content.

Concretely:

```
src/content/
  curriculum.ts              // LessonMeta[], PathMeta[], DAG helpers
  chrome/en.json
  chrome/ko.json
  lessons/
    linear-regression/
      en.mdx                 // eight <Stage> sections, <Experiment />, math
      ko.mdx
    double-descent/
      en.mdx
      ko.mdx
    …
```

The lesson page (`app/[lang]/learn/[slug]/page.tsx`) `await`s `params`, looks up `LessonMeta` by slug, dynamically imports the locale MDX body, and passes experiment ids into the MDX. **[VERIFIED 2026-08-28]** — the spike that proved this works used the **locale-first** layout ``@/content/${lang}/${slug}.mdx``, not the slug-first `content/lessons/${slug}/${lang}.mdx` drawn in the tree above. Either shape can work, but only the locale-first one has actually been built and prerendered; prefer it unless there is a reason not to, and re-spike if you change it. `generateStaticParams` returns the cartesian product `{ lang, slug }` from the registry. `dynamicParams = false` so unknown slugs 404 (pattern from Next 16 MDX guide, `mdx.md` “Using dynamic imports”).

**Fallback if MDX is blocked:** structured TS per lesson (`en.ts` / `ko.ts` exporting stage markdown strings) plus a small markdown renderer and a `<Experiment>` slot. Worse authoring, fully type-safe, no new bundler plugin. **[RESOLVED 2026-08-28] — not needed.** Option D passed the Turbopack check (see the box below). This paragraph is retained as a record of the alternative considered, **not** as a live plan.

> ### ✅ **[RESOLVED 2026-08-28] The three MDX risks (registered as D5, D6, D7) are closed. The premise behind D5 was wrong.**
>
> **D5 / D6 — `@next/mdx` under Turbopack, and `remark-math` / `rehype-katex` composing with it.** The premise that the Next docs example is "webpack-shaped" is **incorrect**. `node_modules/next/dist/docs/01-app/02-guides/mdx.md` documents the **Turbopack-compatible string-plugin form literally**, as `['rehype-katex', { strict: true, throwOnError: true }]`, and states that plugins without serializable options cannot be used with Turbopack **because JS functions cannot be passed to Rust**. A real spike then confirmed the pipeline end to end: it **builds and statically prerenders on Next 16.3.3 with Turbopack**, the measured **client-JS delta for an MDX route is 0 bytes**, `katex.min.js` appears in **no client chunk**, and **MathML is present** in the HTML.
>
> Two non-negotiables fell out of the spike: plugins **must** be named as **strings**, and **`src/mdx-components.tsx` is mandatory**. Resolved versions: `@next/mdx` 16.3.3, `@mdx-js/loader` 3.1.1, `@mdx-js/react` 3.1.1, `remark-math` 6.0.0, `rehype-katex` 7.0.1, `katex` 0.18.4. Keep `strict: true, throwOnError: true` as a deliberate accuracy safeguard: malformed TeX fails the build rather than silently rendering wrong mathematics.
>
> **D7 — dynamic MDX import by slug — is also resolved, positively.** ``await import(`@/content/${lang}/${slug}.mdx`)`` **works**, combined with a finite `generateStaticParams`, `dynamicParams = false`, and locale/slug allowlists. Both locale files were discovered and prerendered. **The static import map fallback is not needed** and should not be built.
>
> Consequence for §3.4's recommendation: option **D (hybrid)** stands, and the "**Fallback if MDX is blocked**" paragraph below is now dead weight — keep it only as a record of what was considered, not as a live plan.

### 3.5 Locale strategy for content (not just chrome)

Today locale is a client Context. Next 16’s internationalization guide (`01-app/02-guides/internationalization.md`) recommends:

- nest routes under `app/[lang]/…`
- `generateStaticParams` for each locale so pages stay static
- JSON dictionaries loaded with dynamic `import()` from Server Components (“only the resulting HTML will be sent to the browser”)
- `await params`; `html lang` from the param
- `next/root-params` for reading `lang` in nested Server Components without prop drilling
- optional `proxy.ts` to prefix the URL from `Accept-Language`

For this project: **put `en` / `ko` in the URL** (`/en/learn/…`, `/ko/learn/…`), matching the existing `Locale` union, not `en-US` / `ko-KR`. Keep the header toggle; it navigates to the same slug with the other prefix. Persist the last locale in a cookie (and, during migration, still write `ai-research-lab.locale`) so the lobby can redirect `/` → `/ko` or `/en` without a flash.

`proxy.ts` is optional sugar for first visits. It is **not** required if both locales are prerendered and `/` redirects. It also will not run on a pure static file host.

**NEEDS VERIFICATION** — whether this deployment target is a Node server (Vercel / `next start`) or a static file host. `proxy.ts` and `next.config` redirects work on a Node host. `output: 'export'` is not set today; if it is added later, proxy-based locale detection does not apply and `/` must be a prerendered chooser or a client redirect.

---

## 4. Navigation and information architecture

### 4.1 URL / route structure (Next.js 16 App Router)

Checked against `01-app/01-getting-started/02-project-structure.md`, `03-layouts-and-pages.md`, `04-linking-and-navigating.md`, `14-metadata-and-og-images.md`, and `02-guides/internationalization.md`.

File-system routing: folders are URL segments; a route is public when a `page.tsx` exists. Dynamic segments use `[name]`. `params` is `Promise<{ … }>` and must be awaited. Prefer the generated helper `PageProps<'/[lang]/learn/[slug]'>`. Layouts nest and preserve state across child navigations. Use `<Link>` from `next/link` (prefetch on viewport) — today’s raw `<a href="#…">` in `Header.tsx` is correct only for in-page hashes, not for lesson routes. Reading `searchParams` in a Server Component page **opts that page into dynamic rendering**; do not put lesson identity in the query string.

Proposed tree:

```
src/app/
  layout.tsx                          // root: fonts, chrome providers that must wrap [lang]
  page.tsx                            // locale chooser / redirect to /{lang}
  not-found.tsx
  global-error.tsx
  [lang]/
    layout.tsx                        // <html lang>, generateStaticParams for en|ko,
                                      // data-scroll-behavior="smooth"
    page.tsx                          // course lobby
    about/page.tsx
    learn/
      layout.tsx                      // course shell: header, path switcher, map link
      page.tsx                        // curriculum map
      [slug]/
        page.tsx                      // lesson (eight stages)
        loading.tsx
        error.tsx
    paths/
      [pathId]/page.tsx               // path landing (“why this route, start / resume”)
```

Public URLs:

| URL | Purpose |
| --- | --- |
| `/` | Redirect to `/{lang}` from cookie, else show two-button chooser |
| `/{lang}` | Course lobby: start / resume / “I came for the lab” |
| `/{lang}/learn` | Curriculum map (DAG + path overlay) |
| `/{lang}/learn/{slug}` | Lesson; stage hashes `#concept` … `#connection` |
| `/{lang}/learn/{slug}#experiment` | Deep link into the runner |
| `/{lang}/paths/{pathId}` | Path pitch and start button |
| `/{lang}/about` | Migrated about copy |

Out of scope for v1: `/lessons` as an alias (audit Stage 4 used that name; `learn` reads as a course, `lessons` as an encyclopedia — pick `learn` and do not ship both). No `/api` routes. No per-stage URLs (`/learn/overfitting/derivation`) — those would fragment SEO and prev/next.

`generateStaticParams` on `[lang]/layout.tsx` emits `{ lang: "en" | "ko" }`. On `[slug]/page.tsx` it emits every `{ lang, slug }` pair from `curriculum.ts`. `generateMetadata` awaits `params`, loads `LessonMeta.summary[lang]`, and sets title/description (today’s root metadata is hardcoded to “Double Descent Experiment” and would be wrong on L01).

**NEEDS VERIFICATION** — `PageProps<'/[lang]/learn/[slug]'>` is generated by `next dev` / `next build` / `next typegen` (`03-layouts-and-pages.md` “Route Props Helpers”). Until typegen has been run after the routes exist, cite the explicit `params: Promise<{ lang: string; slug: string }>` form, which the same guide also documents.

**NEEDS VERIFICATION** — Next 16 scroll restoration with `data-scroll-behavior="smooth"` plus hash changes (`#experiment`) on a new route. Hash scrolling on first load of a prerendered lesson may still need a small client helper. Not tested.

### 4.2 Curriculum overview / map

`/{lang}/learn` is a **map**, not a blog index.

- Nodes as cards clustered into three acts: **Fit** (L01–L09), **Generalize** (L10–L14), **Scale** (L15–L16).
- Edges drawn as “unlocks” (or a simple indented list if a graph viz is too much for v1).
- Active path highlighted; other nodes visible but muted.
- Each card: title, difficulty, minutes, experiment badge, completion check, lock/warn icon.
- “You are here” from `ProgressV1.lastLessonSlug`.
- Filter chips: All / Intuition / Rigorous / Double descent / Optimization.

The lobby (`/{lang}`) does **not** duplicate the map. It answers “what do I click.” The map answers “where am I in the argument.”

### 4.3 Prev / next

Computed from `activePathId` if set, else from canonical `order`.

- `prev` / `next` are `<Link>`s with the localized title, not “Lesson 11.”
- At the end of a path, next is the path landing (“You finished the intuition path. The rigorous path continues with Derivative.”) rather than a dead end.
- Connection stage always names the next node’s *question*, not only its title (“Next: if training error is tiny, why can test error explode?”).

Layouts preserve client state across these navigations (`03-layouts-and-pages.md`). Experiment islands should reset on slug change (key the island by slug) so a run from L11 does not leak into L14.

### 4.4 Prerequisite gating: warn, do not block

Hard-gating is the wrong call for this product.

- There are no accounts; a gate implemented in `localStorage` is theater and breaks the targeted path.
- The honesty promise (“results are never fabricated”) is about experiments, not about trapping readers.
- Cold visitors to the only existing module would bounce.

Instead:

- A persistent banner when hard prerequisites are not in `completedSlugs`: “This lesson assumes *Overfitting* (40 min). [Open that first] [Continue anyway].”
- Recommended-but-missing prereqs use a quieter inline note.
- The map uses a warning state, not a locked card.
- The `double-descent` path’s callout (see §2.3) is the same mechanism, not a special case.

Completion is a student-asserted signal (a “Mark as done” at the Connection stage, plus auto-complete when they run the experiment if one exists). It is not an exam.

### 4.5 Related-concept links

`LessonMeta.related` is a lateral list, not an edge. Examples:

- `overfitting` related: `regularization`, `interpolation-threshold`, `double-descent`
- `gradient-descent` related: `optimization`, `linear-regression` (closed form as contrast)
- `double-descent` related: `regularization` (implicit vs explicit), `neural-network` (“same phenomenon, different model class”)

Render in Connection, and as a small “See also” on the map card. Do not auto-add related nodes to prev/next.

### 4.6 Progress tracking and resume

**Worth persisting (client, versioned):**

- `schemaVersion`, `curriculumVersion`
- `activePathId`
- `lastLessonSlug`, `lastStageId`
- `completedSlugs`, `completedStages`
- `updatedAt`

**Not worth persisting in the progress blob:**

- Full `ExperimentResult` (keep `history.ts`, but validate it)
- Locale (cookie + URL)
- Scroll pixel position

**Storage rules, learning from T10/S2:**

- Key: `ai-research-lab.progress.v1` (or a module-prefixed name). The suffix is a real version: `loadProgress()` parses JSON, type-guards every field, and on failure returns `emptyProgress()` rather than `as ProgressV1`.
- When `curriculumVersion` in storage is stale (lesson slugs renamed/removed), drop unknown slugs, keep known completions, and do not crash.
- Write a sibling migration for `ai-research-lab.history.v1` in the same pass: runtime schema check, ignore malformed entries. Do not wait for a comparison-view feature to make that payload safe.
- No server until there is enough curriculum to justify accounts (audit Stage 4 / Deferred). Design the blob so it can later PUT to an API unchanged.

**Resume:**

- Lobby primary button: if `lastLessonSlug` is set → “Continue: {title}” linking to `/{lang}/learn/{slug}#{lastStageId ?? "concept"}`. Else → “Start here” linking to the first slug of the chosen path (default `rigorous` → `functions-and-parameters`).
- Header “Continue” when progress exists.
- Returning student who last used the hash-only site: no progress blob, history may still exist. Lobby copy: “Your experiment history is still in this browser. The course is new — start at Functions, or jump to the lab.” Do not pretend history equals lesson completion.

**NEEDS VERIFICATION** — quota and private-mode behavior of two `localStorage` keys (history + progress) on the phones the audit worried about in S1. Not measured.

---

## 5. Pedagogical rationale

### 5.1 Why a course spine beats an encyclopedia

Encyclopedia order groups by similarity (all calculus together, all generalization together). Course order groups by *need*. The student is carried by unanswered questions: a line needs a score; a score needs a minimizer; a tiny training score needs a test set; a U-shape needs a name; a perfect fit needs a threshold; a second descent needs the lab.

The eight-stage template is the same idea inside one lesson: name it, feel it, write it, derive it, try to break it, see it, use it, connect it. Skipping `mathematics` / `derivation` on the intuition path is allowed because `experiment` + `visualization` still put the claim at risk. Skipping `experiment` on a calculus lesson is allowed only if a visualization still moves; a static derivative formula with no slope toy is an encyclopedia entry.

**NEEDS VERIFICATION** — the eight-stage sequence is a design hypothesis for this site, not a replicated result from learning-science literature I evaluated for this document. It rhymes with “concrete before abstract” and with worked-example → problem-solving progressions, but I am not citing a specific study as established fact.

### 5.2 Where difficulty steps up too steeply, and the scaffold

| Cliff | Why it is a cliff | Scaffold |
| --- | --- | --- |
| L03 loss → L05 derivative | First calculus. High-school students may have the word “derivative” and not the use “slope of *this* loss curve.” | Numeric slope `(L(θ+h)−L(θ))/h` on a 1-parameter MSE bowl **before** `d/dθ`. One parameter only. No Σ notation until they have seen the picture. |
| L05 → L06 → L07 | 1D slope → “hold the others fixed” → a vector. This is the steepest *math* climb in the course. | Stay in a 2-parameter linear model (`w`, `b`) with a contour plot. Never introduce ∇ on an n-D net first. L07’s experiment is arrows on that contour, not a 100-D diagram. |
| L07 → L08 | From “the arrow exists” to “we walk.” Learning rate is a new free parameter that can diverge. | Animate a few steps by hand (student clicks “step”) before autoplay. Show one explosion from a large rate on purpose. |
| L04 / L10 → L11 | Complexity + generalization together produce the U-shape. Either idea alone is easy; the conjunction is the first *ML* idea, not a math idea. | Reuse the polynomial sweep with the DD verdict **hidden**. Ask the student to find the degree where test error is best. Then name overfitting. |
| L11 → L13 | “Perfect training fit” is not the same as “too complex.” Interpolation is a threshold, not a vibe. | Use the existing interpolation hint (`degree ≈ nTrain − 1`) as a prediction the student checks. Audit P7 (hint vs. detected threshold disagreeing) **must be fixed before this lesson ships** or the scaffold teaches a contradiction. **[VERIFIED 2026-08-28] — this row is correct, and the defect is measurably worse than this document knew.** The detector's fixed `1e-3` train-MSE cutoff is **not noise-aware**: at \(\sigma=1\), train MSE at \(p=n\) is **0.207** and never crosses `1e-3` until **degree 51**, against a theoretical threshold of **39** — the reported "interpolation threshold" is off by **12 degrees**. And the previously celebrated agreement at "threshold = 79 = \(n-1\)" is a **knife-edge crossing** of an arbitrary constant: train MSE is \(1.51\times10^{-3}\) at \(d=78\) and \(6.93\times10^{-4}\) at \(d=79\), whereas genuine interpolation would be \(\sim10^{-16}\). The ridge is damping interpolation, so that agreement confirms the ridge helped — it does **not** calibrate the cutoff. Full evidence in `docs/phase2-synthesis.md`. |
| L13 → L14 | Double descent refutes the story L11 just installed. If L11 was shaky, L14 reads as noise or as a bug — which, given audit P2/P3, it currently *is*. | Do not author L14 prose until Stage 2 science fixes land. On the page: classical U, then interpolation peak, then “watch the overparameterized regime; the lab will not claim a second descent unless the curve shows one.” |
| L14 → L15 | New model class. Biggest conceptual jump after calculus. | One hidden layer, two inputs, ReLU or tanh, drawn as stacked linear regressions plus a bend. No CNNs, no framework APIs. Tie back: overparameterization is the same word they used in L14. |
| L15 → L16 | Chain rule stacked through layers. | Start from L05’s 1D chain, then one hidden unit, then a vector. Students on `intuition` never hit this cliff. |

### 5.3 What we are not teaching in v1

To keep the DAG small and the existing engine central:

- No probability / MLE track (MSE is introduced as “how wrong,” not as a Gaussian negative log-likelihood).
- No bias–variance decomposition as a required node (it can be a related-concept note under overfitting).
- No classification / cross-entropy (would fork the experiment stack).
- No deep-learning engineering (optimizers zoo, dropout as a recipe, GPUs).

These can hang off `related` later without rewriting the spine.

---

## 6. Migration path

Principle: **the lab keeps working at a stable URL while the course grows around it.** Do not wait for sixteen MDX files before moving the workspace. Do not generalize types and author L15 in the same week.

Aligned with audit stages 1–4 (science and lint first; architecture while there is one module; curriculum shell next). This section is only the *content and routing* slice.

### 6.1 M0 — Registry without routes

Add `src/content/curriculum.ts` with the 16 `LessonMeta` records, four paths, and a DAG assert in `scripts/selfcheck.ts` (or Vitest once that exists). No UI change. `/` still is the product.

*Done when:* the graph in this document is executable data, and a cycle would fail CI.

### 6.2 M1 — Lesson route for the existing module only

Add `app/learn/[slug]/page.tsx` (locale prefix can wait one beat if it reduces risk) with `generateStaticParams` returning `double-descent` only. Page is a Server Component shell: title, the three current concept-card texts migrated into stages `concept` / `intuition` / `connection`, and the current `ExperimentWorkspace` as a client island for `experiment` + `visualization`.

Redirects:

- `/#experiments` → `/learn/double-descent#experiment` (document in README; a small client helper may be needed because hashes are not server-redirected).
- Keep `/` rendering the workspace **or** a prominent “Open the lab” that is the same island, until M2. Prefer *moving* the island so there is one copy.

`Header` gains a `next/link` to `/learn/double-descent` and to `/learn` (map stub listing one card). Hash links that remain in-page stay `<a>`.

Set `data-scroll-behavior="smooth"` on `<html>` in this step (audit §1.2) — this is the moment a second route appears.

*Done when:* the lab is deep-linkable, the old `/` does not 500, and there is still a single `ExperimentWorkspace` instance in the tree.

### 6.3 M2 — Course lobby; `/` is no longer the lab

`/` (or `/{lang}` once M3 lands) becomes the lobby of §1.6. Map page lists all 16 nodes; unpublished slugs render as “Coming” (not 404). Only `double-descent` is `published: true` in `LessonMeta` (add that flag). Prev/next on that lesson is disabled or points at “Coming: interpolation threshold.”

This is how the “last lesson is the only content” tension is lived with during the gap: the map tells the truth (14 of 16 locked as unpublished), the lobby offers Start (soon) and Lab (now), and we do not fake a full course.

*Done when:* a new visitor can tell they are at the capstone, and a returning visitor still finds the runner.

### 6.4 M3 — Locale in the URL; split i18n

Introduce `app/[lang]/…`, `generateStaticParams` for `en` | `ko`, `html lang` from params (fixes audit P4 for document language on first paint). Split `i18n.ts`: experiment chrome → `chrome/{locale}.json` (or a still-typed TS module while interpolating functions remain); lesson prose → MDX. Language toggle switches prefix.

Preserve `ai-research-lab.locale` reads for one release so existing visitors keep Korean.

*Done when:* `/ko/learn/double-descent` is prerendered Korean HTML, not a post-hydration swap.

**NEEDS VERIFICATION** — cookie vs. `localStorage` vs. URL as the source of truth on first request, especially if `proxy.ts` is not used. Spike this with a Korean `Accept-Language` browser before deleting the Context provider.

### 6.5 M4 — Author backward from the lab, then fill the calculus chain

Order of *writing* content is not the canonical learning order. Write next what the engine already supports:

1. `interpolation-threshold` (L13) — same sweep, different framing; depends on the P7 fix, which §5.2 now shows is worse than described (the `1e-3` cutoff is not noise-aware).
2. `overfitting` (L11) — **[CORRECTED 2026-08-28]** **not** "same sweep, hide DD verdict." Use Research C's capped cubic experiment definition: different ground truth, hard degree cap of 12 enforced in code, **no `analyzeDoubleDescent` call**. See §1.2.
3. `polynomial-regression` (L04) — **[CORRECTED 2026-08-28]** likewise the capped cubic definition, looking at fitted curves. Not the DD sweep.
4. `generalization` (L10) — train vs test split, already in the UI.
5. `regularization` (L12) — **[CORRECTED 2026-08-28]** likewise the capped cubic definition, not the DD sweep. Needs a ridge *knob* exposed. The engine applies **`RIDGE = 1e-8` multiplied by the mean Gram diagonal** (`src/lib/linalg.ts:19, 45-50`) — a **relative** ridge, not the absolute `1e-10` recorded here before. **STILL OPEN, and now with a second question in front of it:** (i) whether the student-facing λ is **absolute or relative** must be decided and documented before the control is built (the mean Gram diagonal was measured at ≈41 at \(p=41\) and ≈2.3 at \(p=161\), so the two differ by a factor that moves as the student drags degree); and (ii) whether exposing ridge still produces a defensible interpolation / DD story remains unverified (audit §3.3; `docs/phase2-synthesis.md`).
6. Then L01–L03 (cheap prose + small new islands: residual plot, MSE as a number).
7. Then L05–L09 (new visualization islands; no dependence on the polynomial engine).
8. L15–L16 last — new engine, after the `ExperimentDefinition` abstraction exists (audit Stage 3 / R1).

Publish a path only when every slug on it is `published: true`. Ship `double-descent` path first (L04, L10, L11, L13, L14), then `intuition`, then `rigorous`, then `optimization`.

*Done when:* the intuition path is fully walkable without “Coming” nodes.

### 6.6 M5 — Progress, then stop

Add `ProgressV1` + validated load/save, lobby Continue, map checkmarks. Only after two or more published lessons exist — one lesson of progress tracking is noise.

Do **not** build accounts, server persistence, or quiz gating in this migration.

### 6.7 What must not be lost

- The double-descent runner, analysis notes, history, seed reproducibility.
- Bilingual chrome for the experiment (every key in today’s `experiment`, `dataset`, `summary`, `errorChart`, `modelExplorer`, `analysis`, `history`, `verdicts`).
- The honesty copy (`about.p2`, `analysis.subtitle`, DD concept card hedge). It becomes L14 `concept` / `connection`, not marketing fluff on `/`.
- Redirect or documented alias from the README’s `http://localhost:3000` mental model to the new lab URL.

### 6.8 What this document is not

It does not propose React component APIs, does not redesign `ExperimentConfig`, and does not claim the default sweep currently shows double descent (it does not; audit P2/P3). L14 must not be authored as “you will see a second descent” until that is true or the lesson’s experiment stage stays strictly descriptive.

---

## 7. Register of NEEDS VERIFICATION

Collected so implementation spikes can be ticketed without rereading the prose.

1. **Study-time estimates** — not piloted; use as relative weights only (§1.2).
2. **Audience calculus background** — inferred, not taken from a syllabus (§1.2). If wrong, L05–L07 duration and the viability of path `intuition` change.
3. **Intuition path without calculus** — may produce a cargo-cult reading of double descent (§2.2).
4. **Eight-stage template as established pedagogy** — design hypothesis, not a cited empirical result (§5.1).
5. ~~**`@next/mdx` under Turbopack 16.3.3** — docs example is webpack-shaped~~ — **[RESOLVED 2026-08-28]**. **The premise was wrong:** `node_modules/next/dist/docs/01-app/02-guides/mdx.md` documents the Turbopack string-plugin form literally. A real spike builds and statically prerenders on Next 16.3.3 + Turbopack. Plugins must be strings; `src/mdx-components.tsx` is mandatory (§3.4).
6. ~~**`remark-math` / `rehype-katex` composition**~~ — **[RESOLVED 2026-08-28]**. Composes. Measured **0 bytes** client-JS delta for an MDX route; no `katex.min.js` in any client chunk; MathML present. Versions: `@next/mdx` 16.3.3, `@mdx-js/loader` / `@mdx-js/react` 3.1.1, `remark-math` 6.0.0, `rehype-katex` 7.0.1, `katex` 0.18.4. Use `strict: true, throwOnError: true` (§3.4).
7. ~~**Dynamic MDX import by slug** — may need a static import map~~ — **[RESOLVED 2026-08-28], positively**. ``await import(`@/content/${lang}/${slug}.mdx`)`` works with finite `generateStaticParams`, `dynamicParams = false`, and locale/slug allowlists; both locale files were discovered and prerendered. **The static import map is not needed** (§3.4).
8. **Deployment target** — Node (`proxy.ts`, config redirects) vs. static host (no proxy) (§3.5). `output: 'export'` is currently unset.
9. **`PageProps<'/…'>` availability** until `next typegen` / `next dev` has seen the new routes (§4.1).
10. **Hash scrolling onto a newly navigated prerendered lesson** with Next 16 `data-scroll-behavior` (§4.1).
11. **`localStorage` quota / private mode** with both history and progress keys (§4.6).
12. **Cookie vs. `localStorage` vs. URL locale** on first request without `proxy.ts` (§6.4).
13. **Exposing ridge as a student control** for L12 (§6.5) — **still open, and split in two.** (a) **Absolute vs relative λ** in the student-facing control must be decided and documented before the slider is written; the engine's ridge is relative (`RIDGE = 1e-8` × mean Gram diagonal). (b) Whether exposing ridge still leaves a defensible interpolation / DD story. The root cause of the high-degree blow-up is now largely **understood** (conditioning; \(p \to n\); see Research B §16.5a), but **whether this estimator can produce a genuine second descent remains OPEN and is BLOCKING** — see `docs/phase2-synthesis.md`. No L14 prose may be authored until it is settled.
14. **Next 16 `proxy.ts` + static prerender** — documented for i18n redirects; interaction with a fully static `generateStaticParams` locale tree is not verified in this repo (§3.5).
15. **[ADDED 2026-08-28] Uncalibrated detector constants.** `DD_THRESHOLDS` (`CLEAR_RISE`, `CLEAR_DROP`, `RISE`, `DROP`, `COMPETITIVE_SECOND_MIN: 2`, `DIVERGENCE_RISE: 100`) and `INTERPOLATION_MSE_THRESHOLD: 1e-3` are hand-picked magic numbers, now demonstrably wrong in at least one regime. This is a first-class engineering task, not a documentation nit (§5.2).
16. **[ADDED 2026-08-28] Locale must be a prop on the experiment island.** Research C's `analyze(result, locale)` takes a locale; this document resolves locale from the URL. The island receives `lang` as a prop — see §3.3 gap (b) — or the "analysis notes computed twice, one in the wrong language" defect is rebuilt inside the new abstraction.
17. **[ADDED 2026-08-28] Renumber `order` to a contiguous 1…18** when `curriculum.ts` is authored, following the sequence in §1.2 including nodes 9a (`normal-equations`) and 13a (`conditioning`). Path membership for the two new nodes must be set at the same time.

---

## 8. Summary of recommendations

- **Graph:** **[CORRECTED 2026-08-28]** **18-node** DAG (adds `normal-equations` at 9a and `conditioning` at 13a), calculus *after* a working loss, generalization *before* neural nets, polynomial regression inserted as the complexity knob, double descent at node 14 as capstone of the generalize-act. Soft-prereq regularization; no cycles on hard edges. **§1.2 is authoritative for curriculum order** (Research B §17 is a math dependency graph, not a shipping order).
- **Paths:** `rigorous` (all 18), `intuition` (skip L05–L09 and L15–L16), `double-descent` (L04→L10→L11→L13→L14 with warnings, `conditioning` as a sidebar), `optimization` (fit/train track).
- **Content:** hybrid registry (TS) + MDX bodies (per locale) + JSON chrome. Server-rendered lessons, client experiment islands (which **receive `lang` as a prop**). **[RESOLVED]** the MDX/Turbopack/KaTeX pipeline is confirmed by a real spike; the typed-TS fallback is not needed.
- **Experiment reuse:** **[CORRECTED]** nodes 4/11/12 use Research C's **capped cubic** definition (hard degree cap of 12, enforced in code, no `analyzeDoubleDescent`), **not** a re-skinned double-descent config. Nodes 13/13a/14 keep the DD workspace.
- **Blocking:** no `double-descent` prose may be authored, and no lesson may promise a second descent, until the central scientific question is settled. See `docs/phase2-synthesis.md`.
- **Routes:** `/{lang}/learn/{slug}` with awaited `params`, `generateStaticParams`, `generateMetadata`, warn-don’t-gate, versioned validated progress, lobby resume.
- **Tension:** lobby with two CTAs + briefing on L14 + migrate the workspace to its canonical lesson URL; never hard-block the lab.
- **Migration:** registry → one lesson route → lobby → locale prefix → author backward from the lab → progress last.
