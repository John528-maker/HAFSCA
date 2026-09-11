# Phase 3 — Implementation Plan

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Branch:** `ml-platform-v2`
**Date:** 2026-08-28
**Role:** Architect. This is the contract Phase 4 builds from.
**Inputs:** `docs/phase2-synthesis.md` (locked decisions), verified research A–D, measured double-descent investigation, MDX spike.

Do not optimize for feature count. Sequence by **accuracy × educational value × reuse of the existing engine**.

---

## 0. What is already true

- Next.js 16.3.3 App Router, React 19.2.8, TypeScript strict, Tailwind v4, Recharts 3.10.
- MDX + KaTeX SSR is **GO**: string-named plugins, `strict`/`throwOnError`, 0-byte client-JS delta, `await import(\`@/content/${lang}/${slug}.mdx\`)` works with `generateStaticParams`.
- KaTeX CSS is scoped to `src/app/[lang]/learn/layout.tsx` (not the root layout).
- A thin lesson scaffold already exists at `/{lang}/learn/{slug}` with English/Korean sample MDX for `linear-regression`.
- The flagship lab now reports interpolation as **theoretical `nTrain − 1`**, evaluates **truth-target test MSE as primary** with noisy-label MSE as a secondary series, and uses a verdict taxonomy that can say *variance explosion*, *partial recovery*, *sweep exhausted*, or *numerical failure* without calling a real peak a bug.
- `localStorage` locale remains on `/` until the URL-locale migration lands. History key is `ai-research-lab.history.v2`.

---

## 1. Locked constraints (do not reopen)

| Decision | Rule |
| --- | --- |
| Loss | \(J = \frac1n\sum(\hat y - y)^2\). **No \(\tfrac12\)**. \(H_{22}=2\) is a regression assert. |
| Residual | \(\mathbf r = X\theta - y\). Opposite sign makes GD *ascend*. |
| Count | \(p = d+1\); \(n\) is training samples. |
| Math | MDX + server KaTeX, plugin **strings**, `strict: true, throwOnError: true`. |
| Locale | URL `/{lang}/learn/{slug}`. Experiment islands take `lang` as a prop. |
| Order | Research D §1.2 (18 nodes). B §17 is a math DAG only. |
| Double descent copy | Describe measured variance explosion and partial recovery. **Do not promise `secondMin < firstMin`.** |
| Overfitting copy | Plateau at degrees 3–5; never “best degree is the true degree 3.” Cap **12 in code**. |
| λ slider | **Blocked** until absolute vs relative ridge is decided. |

---

## 2. Architecture to land first

### 2.1 Curriculum registry

**Feature:** typed `LessonMeta` + `ExperimentDefinition` registries.
**Purpose:** one graph, many paths; experiments are islands, lessons are Server Components.
**New files:** `src/curriculum/curriculum.ts`, `src/curriculum/paths.ts`, `src/experiments/registry.ts`.
**Schema (required fields already decided):**

```ts
experimentId?: string;
experimentConfig?: Partial<TConfig>; // per-lesson override; do not clone the DD workspace
```

**Complexity:** medium. **Test:** DAG has no cycles; every `experimentId` exists; every path only walks existing slugs.

### 2.2 Routing

**Files:** keep `src/app/[lang]/learn/layout.tsx` (KaTeX CSS) and `[slug]/page.tsx`; add `src/app/[lang]/page.tsx` lobby, `src/app/[lang]/learn/page.tsx` map, `src/app/[lang]/paths/[pathId]/page.tsx`.
**Migrate `/`:** lobby with “Start the course” vs “I came for the lab”; redirect `/#experiments` → `/{lang}/learn/double-descent`.
**Await `params`.** `generateStaticParams` for `{lang, slug}`. `<Link>`, not hash `<a>`.
**Warn on missing prerequisites; do not gate.**

### 2.3 Progress

Versioned, validated blob (last lesson/stage, path, completions). Do not reuse unvalidated `history.v1`. Bump keys when the schema changes (history is already `v2`).

---

## 3. Features (by workstream)

Each item: purpose, files, complexity, tests.

### A — Independent: concept pages (MDX)

| Feature | Purpose | Files | Complexity | Tests |
| --- | --- | --- | --- | --- |
| Lesson chrome (8-stage template) | Shared MDX components: What / Why / Intuition / Math / Derivation / Experiment slot / Applications / Related / Summary | `src/mdx-components.tsx`, `src/components/lesson/*` | M | visual + heading outline |
| L01 functions-and-parameters | Name “a model is a parameterized function” using existing polynomial language | `src/content/{en,ko}/functions-and-parameters.mdx` | S | build TeX |
| L02 linear-regression | Replace spike sample with a real lesson; live LR experiment later | `src/content/{en,ko}/linear-regression.mdx` | M | TeX + link to experiment |
| L03 loss-function | Name the y-axis the engine already computes | MDX | S | TeX; \(1/n\) convention |
| L10 generalization | Name train/test split already in `dataset.ts` | MDX | S | copy review |
| Korean webfont | Geist is Latin-only | `layout.tsx` + subset CJK, `font-display: swap` | M | payload budget, both locales |

**Defer:** L15–L16 neural nets / backprop until the polynomial spine exists. **Drop from v2:** momentum, logistic GD, in-browser nets.

### B — Independent: math components

Equation, variable definition, step-by-step derivation, numerical example. Implemented as MDX/hast via KaTeX first; extra React widgets only where interaction is required (not for static algebra). Reuse B’s verified worked examples verbatim.

### C — Shared experiment infrastructure (blocks new labs)

| Feature | Purpose | Files | Complexity | Tests |
| --- | --- | --- | --- | --- |
| `ExperimentDefinition` | `id`, `mode: live\|batch`, `defaultConfig`, `validate`, `run`, `analyze(result, locale)` | `src/experiments/*` | M | registry unit asserts |
| Solver λ argument | Prerequisite for regularization lesson; **contract must say absolute vs relative** | `src/lib/linalg.ts`, `regression.ts` | M | existing linear-fit MSE; new λ identity |
| Degree cap helper | `MAX_POLY_DEGREE_FOR_U_LABS = 12` in `validate` | `src/lib/experiment.ts` or new module | S | reject 13 |
| Shared Field/Stat/EmptyChart | Kill copy-pasted empty states | `src/components/ui/*` | S | visual |
| `lang` prop on islands | Stop dual-locale notes | experiment wrappers | S | KO notes when `lang=ko` |

### D — Core ML modules (reuse the engine)

High leverage: **name what already runs**.

1. **Expose train/test sizes and interpolation formula** on the existing lab (already partly done).
2. **Ridge as a lesson**, not a slider, until λ semantics are chosen: explain the relative `1e-8 × mean(diag)` in L12/L13a copy.
3. **Bias–variance overlay** after overfitting lab: same `fitPolynomial`, \(M-1\) variance, bias² remedy from C §7.

### E — Interactive experiments (dependency order)

| Order | Lab | Spec | Complexity | Tests |
| --- | --- | --- | --- | --- |
| **1** | **Gradient descent** | Research C §3 **verbatim**. Analytic \(\alpha_{\mathrm{crit}}=2/\lambda_{\max}\). Feature-scale slider \(s\). | M | ship C’s numeric asserts (0.09% band) |
| 2 | Linear regression (live points) | C §2; editable scatter; \(S_{xx}\) rank guard | M | drag updates line + MSE |
| 3 | Overfitting (capped cubic) | C §4 with plateau copy, seed-1 note, cap 12 | M | U-shape at seed 42; “no sweet spot” at seed 1 |
| 4 | Activations | C §5; implement erf or labelled tanh; **no “matches PyTorch”** | S | \(\varphi,\varphi'\) tables |
| later | Bias–variance | C §7, \(d\le12\), \(M-1\) | M | divisor selfcheck |
| blocked | Ridge λ path | until absolute/relative | — | — |
| capstone | Existing DD workspace | honest peak + dual metric (in tree now) | done | selfcheck |

### F — Navigation / UI

Prev/next from the DAG; related + prerequisites; difficulty; progress. Lobby vs lab (D’s “do not hide the lab”). Accessibility: keyboard model selection (audit), `data-scroll-behavior` on `<html>` if CSS remains `scroll-behavior: smooth`.

---

## 4. Independent vs ordered work

```
Independent (parallel after §2.1–2.2 exist, different files)
├── MDX lessons L01–L03, L10 (content/*)
├── Math MDX patterns (no new solver)
├── Korean webfont (layout only)
├── GD lab math in src/lib/gd.ts (no UI)
└── UI chrome / nav components (no src/lib)

Spine (must stay serial)
Architecture (registry + routes)
  → Shared components (islands, Field/Stat, lang prop)
    → Core ML (λ API decision, degree cap)
      → Experiments (GD first, then LR, then overfitting)
        → Content integration (embed islands in MDX)
          → QA
```

Same-file rule: do not parallel-edit `src/lib/linalg.ts`, `src/lib/i18n.ts`, or `src/app/[lang]/learn/[slug]/page.tsx`.

---

## 5. Recommended first three builds

1. **Curriculum registry + `/{lang}/learn/{slug}` lobby/map** — without this, content and experiments cannot connect. The MDX pipeline is already proven.
2. **Gradient descent lab (C §3)** — only fully measured experiment; teaches the Function → Loss → Gradient → Update chain the course needs; does not wait on λ or DD copy.
3. **Overfitting lab with enforced cap 12** — reuses `fitPolynomial`; teaches the chart the home page already shows, without the DD detector.

Then: name-the-engine lessons (loss, split, generalization), then GD UI polish, then L13a conditioning using the measured κ tables, then honest L14.

---

## 6. Blocked / deferred / dropped

**Blocked:** student-facing λ slider; any copy that claims reliable true double descent.

**Deferred:** neural nets, backprop, logistic, momentum, ReLU XOR, Zhang random-label demo, effective-df trace unless implemented.

**Dropped from v2:** cloning the DD sweep as the overfitting lab; MathJax; client `katex.min.js`; encyclopedia-style unrelated topics.

---

## 7. Needs a human (do not silently drop)

Audience calculus background; study-time estimates; screen-reader test of KaTeX MathML (EN+KO); misconception frequencies; Node vs `output: 'export'` host.

---

## 8. Spike cleanup record

| Keep | Remove |
| --- | --- |
| `package.json` MDX/KaTeX deps | `src/app/spike/`, `src/app/plain/` |
| `next.config.ts` `createMDX` | root-layout KaTeX CSS (moved to learn layout) |
| `src/mdx-components.tsx` | — |
| `src/app/[lang]/learn/**` + `src/content/{en,ko}/linear-regression.mdx` as the **real** scaffold (dynamic import + SSG already work) | throwaway `/spike` and `/plain` comparison routes |

---

## 9. Testing strategy (whole Phase 4)

- Keep `scripts/selfcheck.ts` as the scientific contract (no framework). Add GD asserts from C §3 when that lab lands.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` every merge; Next 16 does **not** lint during build.
- TeX: `throwOnError` is the math QA gate.
- Browser: `/`, `/en/learn/linear-regression`, `/ko/learn/linear-regression`, lab run, language switch, mobile.
