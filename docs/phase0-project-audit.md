# Phase 0 — Project Audit

**Repository:** `C:\Users\exleo\OneDrive\Desktop\HAFS CA`
**Audited commit:** `b0268ac` — "Add AI Research Lab double descent MVP." (working tree clean at audit time)
**Audit date:** 2026-08-28
**Scope:** read-only analysis. No source file was modified, created, or deleted. The only file written by this audit is this document.

**Verification commands actually run**

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run lint` (`eslint`) | **FAIL** (exit 1, 2 errors) |
| `npm run build` (`next build`) | **PASS** (exit 0, 47s, Turbopack) |
| `npm run selfcheck` (`node --experimental-strip-types scripts/selfcheck.ts`) | **PASS** (15/15 assertions) |
| `node --experimental-strip-types scripts/smoke-experiment.ts` | **PASS** (exit 0) — but surfaced a content problem, see §3 and §6 |

`next dev` was not started, per instructions.

---

## 1. Current architecture

### 1.1 Stack and versions

| Layer | Choice | Version (from `package.json` / `node_modules/next/package.json`) |
| --- | --- | --- |
| Framework | Next.js **16.3.3**, App Router | `next@16.3.3` |
| UI runtime | React 19.2.8 / React DOM 19.2.8 | `react@19.2.8` |
| Language | TypeScript 5.x, `strict: true` | `typescript@^5` |
| Styling | Tailwind CSS v4 via PostCSS plugin | `tailwindcss@^4`, `@tailwindcss/postcss@^4` |
| Charts | Recharts 3.x | `recharts@^3.10.1` |
| Lint | ESLint 9 flat config + `eslint-config-next@16.3.3` | `eslint@^9` |
| Local Node | v24.14.1 | — |
| Bundler | **Turbopack** (Next 16 default, confirmed in build output) | — |

There is **no** state library, no data layer, no backend, no test framework, no CI, no formatter config, and no dark-mode support.

### 1.2 Next.js 16 conventions that differ from a typical agent's assumptions

Per `AGENTS.md`, version-sensitive behavior was checked against the local docs in `node_modules/next/dist/docs/`, primarily `01-app/02-guides/upgrading/version-16.md`.

- **Turbopack is the default bundler** for both `next dev` and `next build` (`version-16.md:126`). Any future webpack config in `next.config.ts` will be ignored unless Turbopack is explicitly opted out of. Turbopack config lives under a different key than in 15 (`version-16.md:180`).
- **`next lint` has been removed** (`version-16.md:1082`). `package.json:9` correctly uses bare `eslint`. A consequence: **`next build` does not run ESLint**, which is why the build passes while lint fails.
- **ESLint flat config is the default** (`version-16.md:953`); `eslint.config.mjs` already uses `defineConfig` + `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. Do not migrate back to `.eslintrc`.
- **Scroll behavior override changed** (`version-16.md:961`). Next 16 no longer neutralizes a global `scroll-behavior: smooth` during navigation unless `<html data-scroll-behavior="smooth">` is set. `src/app/globals.css:37-39` sets smooth scrolling but `src/app/layout.tsx:28-31` does **not** set the attribute. Harmless today (single route, hash anchors only); becomes a real navigation-feel bug the moment a second route exists.
- **Async request APIs** (`params`, `searchParams`, `cookies`, `headers`) are async-only (`version-16.md:281`). Not yet used anywhere in this project, but every future dynamic lesson route must `await params`.
- **Cache Components / PPR** is opt-in via top-level `cacheComponents` (`version-16.md:582`, `:1200`); the old `experimental.dynamicIO` / `experimental.useCache` flags are gone. Not used here.
- **`middleware.ts` is now `proxy.ts`** (`version-16.md:612`). Not used here.
- **`revalidateTag` requires a second `cacheLife` argument** (`version-16.md:442`). Not used here.
- **React Compiler support is stable but off by default** (`version-16.md:395`). Relevant later given the heavy chart re-render surface.
- `next build` no longer prints `size` / `First Load JS` (`version-16.md:985`), so bundle-size regressions must be measured with an external tool.

### 1.3 Directory layout

```
HAFS CA/
├─ ai-research-lab/          ← EMPTY, untracked stray directory (see §7)
├─ docs/                     ← created by this audit only
├─ public/                   ← 5 unused create-next-app boilerplate SVGs
├─ scripts/
│  ├─ selfcheck.ts           ← assert-based ML core checks (the de-facto test suite)
│  └─ smoke-experiment.ts    ← end-to-end engine smoke run
└─ src/
   ├─ app/                   ← App Router: layout.tsx, page.tsx, globals.css, favicon.ico
   ├─ components/            ← 12 flat .tsx files, no subfolders
   ├─ lib/                   ← 9 .ts modules: ML engine + i18n + persistence
   └─ types/experiment.ts    ← all domain types in one file
```

### 1.4 Rendering model

- `src/app/layout.tsx` is the only Server Component of consequence. It owns `metadata`, `next/font` (Geist / Geist Mono), and wraps children in `<LanguageProvider>`.
- **`src/app/page.tsx:1` is `"use client"`.** The entire page — hero, workspace, concepts, about, footer — is therefore a Client Component tree. The app derives essentially zero benefit from React Server Components.
- All computation is browser-side and synchronous on the main thread. There is no server, no API route, no route handler, no `fetch`.
- Build output confirms two fully static routes.

### 1.5 Route map

| Route | File | Type | Notes |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Static (`○` prerendered) | The entire product. Client Component. |
| `/_not-found` | (framework default) | Static | No custom `not-found.tsx` exists. |

There are **no** `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, route groups, dynamic segments, parallel/intercepting routes, route handlers, or `proxy.ts`.

In-page navigation is done with raw `<a href="#...">` anchors (`src/components/Header.tsx:9-11`), not `next/link`:

| Anchor | Section owner |
| --- | --- |
| `#top` | `src/components/Hero.tsx:10` |
| `#experiments` | `src/components/ExperimentWorkspace.tsx:91` |
| `#concepts` | `src/app/page.tsx:20` |
| `#about` | `src/app/page.tsx:42` |

### 1.6 State management

Entirely local React state, no library. The single stateful hub is `ExperimentWorkspace`:

- `src/components/ExperimentWorkspace.tsx:27-36` — six `useState` slices: `config`, `result`, `selectedDegree`, `running`, `progress`, `error`, `history`.
- Derived values via `useMemo`: `selected` (line 42) and `analysisNotes` (line 47).
- Cross-cutting locale state lives in a single React Context: `src/components/LanguageProvider.tsx:25` (`LanguageContext`), consumed through `useLanguage()` (line 79), which throws if used outside the provider.
- Persistence: `localStorage` only — `src/lib/history.ts:3` (`ai-research-lab.history.v1`, capped at 30 entries) and `src/lib/i18n.ts:5` (`ai-research-lab.locale`).
- Props are threaded manually from `ExperimentWorkspace` down one level to every panel. There is no reducer, no event bus, no URL state (experiments are not shareable by link).

### 1.7 Styling system

- Tailwind v4, imported with `@import "tailwindcss"` (`src/app/globals.css:1`) — no `tailwind.config.js`; theme is declared in CSS.
- Design tokens as CSS custom properties in `:root` (`globals.css:3-14`) and re-exported to Tailwind via `@theme inline` (`globals.css:16-29`): `background`, `foreground`, `card`, `muted`, `border`, `accent`, `accent-soft`, `train`, `test`, `threshold`, plus font vars.
- **Light theme only.** No `prefers-color-scheme` block, no `.dark` variant.
- All component styling is inline Tailwind utility strings. No CSS modules, no `clsx`/`cva`, no variant system. Repeated card styling (`rounded-lg border border-border bg-card p-5 shadow-sm`) is copy-pasted across six components.

### 1.8 Build / tooling configuration

- `next.config.ts` is empty boilerplate (`next.config.ts:3-5`) — no image config, no headers, no redirects, no `reactCompiler`.
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess` is **not** enabled (the code compensates with pervasive `!` non-null assertions), `allowImportingTsExtensions: true`, path alias `@/* → ./src/*`, and **`"exclude": ["node_modules", "scripts"]`** — meaning `npx tsc --noEmit` **does not typecheck `scripts/`**.
- `eslint.config.mjs` is minimal: the two Next presets plus the default ignore list. No custom rules, no `--max-warnings 0`, no lint of `scripts/` exclusions.
- No `.prettierrc`, `.editorconfig`, `.nvmrc`, `.github/workflows`, Husky, or lint-staged.

---

## 2. Existing features

1. **Configure an experiment** — dataset size (fixed options 20/50/100/200/500), noise level (0–1 slider), max model complexity (slider, upper bound derived from train size), random seed (number input), and a read-only 80/20 train/test split display. `src/components/ExperimentSettings.tsx:52-129`.
2. **Run a complexity sweep** with a live progress bar and percentage. `src/lib/experiment.ts:87-187`, UI at `ExperimentSettings.tsx:141-163`.
3. **Dataset scatter plot** of train vs test points. `src/components/DatasetChart.tsx`.
4. **Experiment summary card** — 8 metrics including best complexity, min train/test error, detected interpolation threshold, and the double-descent verdict, plus a warning when the expected threshold lies beyond the sweep. `src/components/ExperimentSummary.tsx`.
5. **Complexity-vs-error chart** with train/test curves, a dashed reference line at the detected interpolation threshold, a log/linear y-axis toggle, and click-to-select a degree. `src/components/ErrorChart.tsx`.
6. **Selected-model explorer** — five stats plus the fitted curve overlaid on the train/test scatter. `src/components/ModelExplorer.tsx`.
7. **Automatic analysis notes** — natural-language observations generated only from patterns actually present in the run. `src/lib/analysis.ts:134-188`, rendered by `AnalysisPanel.tsx`.
8. **Experiment history** — last 30 runs in `localStorage`, with "Load settings" to restore a past configuration and "Clear". `src/lib/history.ts`, `src/components/ExperimentHistory.tsx`.
9. **English / Korean bilingual UI** with a header toggle and `localStorage` persistence. `src/lib/i18n.ts`, `src/components/LanguageProvider.tsx`.
10. **Static concept and about sections** — three concept cards and three about paragraphs. `src/app/page.tsx:19-53`.
11. **Deterministic reproducibility** — same seed produces the same dataset and split (asserted in `scripts/selfcheck.ts:73-84`).

Features that do **not** exist: user accounts, any server persistence, experiment comparison/diff (the data is stored for it — `src/types/experiment.ts:64-65` — but no UI), export/share, any second ML topic, lessons/quizzes/progress tracking, search, or dark mode.

---

## 3. Existing ML content

### 3.1 The single ML module

There is exactly one ML topic: **double descent in polynomial regression**, implemented across `src/lib/`.

| Concern | File | Implementation |
| --- | --- | --- |
| PRNG | `src/lib/random.ts:2` | Mulberry32 |
| Gaussian noise | `src/lib/random.ts:14` | Box–Muller |
| Shuffle | `src/lib/random.ts:22` | Fisher–Yates |
| Ground truth | `src/lib/dataset.ts:5` | `y = sin(2πx)` on `x ∈ [-1, 1]` |
| Input sampling | `src/lib/dataset.ts:15` | Arcsine (Chebyshev) measure, `x = cos(πU)` |
| Dataset + split | `src/lib/dataset.ts:20-60` | Additive Gaussian noise; shuffled 80/20 split |
| Features | `src/lib/regression.ts:9` | Chebyshev polynomials of the first kind, `T₀=1, T₁=x, T_{k+1}=2xT_k − T_{k−1}` |
| Fit | `src/lib/regression.ts:29` → `src/lib/linalg.ts:24` | Minimum-norm least squares with a 1e-10 ridge; primal path when `p ≤ n`, dual path when `p > n`; Gaussian elimination with partial pivoting, falling back to Jacobi eigendecomposition + pseudo-inverse |
| Metrics | `src/lib/metrics.ts` | MSE, generalization gap |
| Threshold detection | `src/lib/analysis.ts:13` | First degree where train MSE `< 1e-3` |
| Double-descent detection | `src/lib/analysis.ts:48` | Smoothed curve → first local min → peak → second min, gated by rise/drop ratios |
| Narrative generation | `src/lib/analysis.ts:134` | Locale-aware note strings |

### 3.2 Prose content

Bilingual explanatory copy lives in `src/lib/i18n.ts`: three concept cards (overfitting `:126`, interpolation threshold `:129`, double descent `:132`), three about paragraphs (`:136-138`), and ten analysis-note templates (`:97-112`). Korean mirrors at `:238-279`.

### 3.3 Correctness assessment

**Verified correct** (checked against standard definitions and, where noted, exercised by `scripts/selfcheck.ts`):

- Chebyshev recurrence (`regression.ts:9-17`) — standard and correct; `T₀=1`, `T₁=x` seeded properly.
- `paramCount = degree + 1` (`regression.ts:40`) — correct for a degree-`d` polynomial basis.
- Arcsine sampling `x = cos(πU)`, `U ~ Uniform(0,1)` (`dataset.ts:15-18`) — correct; this is the Chebyshev orthogonality measure, and pairing it with a Chebyshev basis genuinely improves conditioning relative to uniform sampling. The README claim at `README.md:33` is accurate.
- Min-norm least squares formulas (`linalg.ts:30-40`) — correct: `θ = (XᵀX + λI)⁻¹Xᵀy` for `p ≤ n`, `θ = Xᵀ(XXᵀ + λI)⁻¹y` for `p > n`. Verified empirically: `selfcheck.ts` case 3 confirms overparameterized fits interpolate (train MSE ~1e-18) with finite, small coefficient norms, and that the norm *decreases* from degree `n+5` to `n+15` (2.571 → 0.879), which is the expected min-norm behavior.
- Mulberry32, Box–Muller, Fisher–Yates (`random.ts`) — all textbook-correct implementations.
- MSE (`metrics.ts:1-14`) — correct.
- Exact recovery of `y = 2 + 3x` at degree 1 yields Chebyshev coefficients `[2, 3]` (`selfcheck.ts:30-41`) — correct, since `T₀=1` and `T₁=x`.
- `trueFunction(0.25) = sin(π/2) = 1` (`selfcheck.ts:89`) — correct.
- The concept prose for overfitting, interpolation threshold, and double descent (`i18n.ts:126`, `:129`, `:132`) is conceptually sound and appropriately hedged. The Korean translations are faithful.
- The UI's stated expectation that interpolation occurs near `degree = nTrain − 1` (i.e. `p = n`) — `ExperimentSettings.tsx:30`, `experiment.ts:163` — is correct.

**Confirmed problem — the headline phenomenon does not actually reproduce, yet is reported as present.**

Running `scripts/smoke-experiment.ts` with the shipped defaults (N=100, noise=0.2, seed=42, max complexity 160, nTrain=80) produced:

```
bestComplexity: 13          minTestError: 3.19e-2
interpolationThreshold: 75  doubleDescentStatus: 'Possible Double Descent'
Test MSE at first/mid/last: 0.397 / 1.66e6 / 3.47e4
```

The test error peaks at ~1.7 million and "descends" only to ~34,700 at maximum complexity — roughly **10⁶ times worse** than the best model's 0.032. This is a numerical blow-up, not a second descent. Because `analyzeDoubleDescent` (`analysis.ts:112-125`) gates purely on *relative* ratios (`peak/firstMin ≥ 1.2` and `secondMin/peak ≤ 0.85`) with no absolute sanity check for the "Possible" tier, the app tells a student it observed possible double descent on a run that shows nothing of the kind. The stricter "Clear" tier does require `secondMin < firstMin` (`analysis.ts:118`), so only the "Possible" tier is affected. This directly contradicts the app's own honesty promise at `i18n.ts:137` ("Results are never fabricated") and its stability claim in the same paragraph.

**`NEEDS VERIFICATION` — items I could not confirm:**

- **Root cause of the high-degree blow-up.** The most likely candidates are (a) the fixed `RIDGE = 1e-10` (`linalg.ts:17`) being too small relative to the Gram matrix scale once `p ≫ n`, so the Gaussian-elimination solve returns an inaccurate `α`; or (b) genuine ill-conditioning of `XXᵀ` that the `RCOND = 1e-12` pivot cutoff does not catch, so the pseudo-inverse fallback is never triggered. `selfcheck.ts` case 3 only probes to degree `n+15`, well short of the `2n` the UI defaults to. I attempted a direct coefficient-norm sweep across degrees to distinguish these but the probe was not executed, so the attribution remains unconfirmed. This should be the first thing measured in Phase 1.
- **Whether this dataset/basis/estimator combination can produce a genuine second descent at all** (i.e. `secondMin < firstMin`) for any reachable configuration. If it cannot, the entire premise of the module is unsupported and either the estimator, the noise model, or the framing must change.
- **The five detection constants** in `DD_THRESHOLDS` (`analysis.ts:5-11`: `SMOOTH_WINDOW 3`, `CLEAR_RISE 1.5`, `CLEAR_DROP 0.7`, `RISE 1.2`, `DROP 0.85`) are unsourced magic numbers with no calibration evidence in the repo. Their false-positive/false-negative behavior on real curves is unknown; `selfcheck.ts:103-139` only tests one synthetic "clear" curve and one flat curve.
- **The `1e-3` absolute interpolation cutoff** (`experiment.ts:18`). It is not scaled by noise level or target variance, so at low noise the train MSE crosses it well before `p = n` and the reported threshold is too early; at high noise it may never be crossed. The default run reported degree 75 against a theoretical 79 — an understandable but unvalidated approximation. Additionally, with a strided degree grid (`experiment.ts:68-73`) the reported threshold can be off by up to one stride.
- **Whether the Jacobi eigendecomposition fallback** (`linalg.ts:104-179`) is ever exercised in practice, and whether it is numerically correct at the sizes involved. It has no dedicated test.
- The claim in `i18n.ts:137` / `README.md:33` that "high-degree fits stay numerically stable" — contradicted by the observed run, but I have not isolated whether the instability is in the fit or in the extrapolation of the prediction.

---

## 4. Existing visualization

Three Recharts-based visualizations, all wrapped in `ResponsiveContainer`, all with `isAnimationActive={false}` on lines.

| Chart | File | Recharts type | Series | Interactivity |
| --- | --- | --- | --- | --- |
| Dataset scatter | `DatasetChart.tsx:40` | `ScatterChart` | Train scatter (blue), test scatter (red) | Tooltip only |
| Complexity vs error | `ErrorChart.tsx:87` | `LineChart` | Train line, test line, `ReferenceLine` at threshold | Log/linear toggle, click-to-select degree, tooltip showing raw (unclamped) MSE |
| Model explorer | `ModelExplorer.tsx:70` | `ComposedChart` | Train scatter, test scatter, fitted-curve line over 201 sampled x-values | Tooltip only |

Notable implementation details:

- Log-scale safety: `clampForLog` (`ErrorChart.tsx:180-183`) floors values at `1e-12` for the log axis while `trainRaw`/`testRaw` preserve true values for the tooltip. Sound approach.
- Click-to-select reads `activePayload[0].payload.degree` through an inline structural cast (`ErrorChart.tsx:90-95`) because Recharts' click-state type is not exported. Fragile against Recharts upgrades.
- The tooltip formatter branches on `name === c.trainError` (`ErrorChart.tsx:129`) — a **string comparison against a translated label**. It works only because both sides read the same locale object; it will silently mis-format if series naming and label lookup ever diverge.
- **Every chart color is a hardcoded hex literal** — `#2563eb`, `#dc2626`, `#e5e5e2`, `#b45309`, `#111827` — duplicated across all three chart files, despite `--train`, `--test`, `--border`, `--threshold` already existing as CSS variables in `globals.css:11-13`. Dark mode or theming will require touching every chart.
- Recharts is a static import in all three components, so it is in the initial client bundle even though nothing is visible until the user runs an experiment. No `next/dynamic`, no `Suspense`.
- No axis descriptions, no `role="img"`, no data table fallback, no keyboard access to data points.

---

## 5. Existing reusable components

### 5.1 Component inventory

| Component | File | Type | Props | Consumers | Reusability |
| --- | --- | --- | --- | --- | --- |
| `RootLayout` | `app/layout.tsx:22` | Server | `children` | Next | n/a |
| `Home` | `app/page.tsx:9` | **Client** | — | Next | n/a |
| `LanguageProvider` | `components/LanguageProvider.tsx:37` | Client | `children` | `layout.tsx:33` | High — genuinely generic |
| `useLanguage` (hook) | `components/LanguageProvider.tsx:79` | Client | — | 10 components | High |
| `Header` | `components/Header.tsx:5` | Client | none | `page.tsx:14` | Low — nav links hardcoded inline |
| `Hero` | `components/Hero.tsx:5` | Client | none | `page.tsx:16` | Low — content hardcoded |
| `ConceptCard` | `components/ConceptCard.tsx:8` | Server-capable (no `"use client"`) | `title`, `children` | `page.tsx:29,32,35` | **High — the only truly generic presentational component** |
| `ExperimentWorkspace` | `components/ExperimentWorkspace.tsx:25` | Client | none | `page.tsx:17` | Low — the state hub |
| `ExperimentSettings` | `components/ExperimentSettings.tsx:19` | Client | `config`, `onChange`, `onRun`, `running`, `progress` | Workspace | Medium — well-typed, but `ExperimentConfig` is double-descent-specific |
| `DatasetChart` | `components/DatasetChart.tsx:20` | Client | `dataset` | Workspace | Medium |
| `ExperimentSummary` | `components/ExperimentSummary.tsx:11` | Client | `summary` | Workspace | Low — field list hardcoded |
| `ErrorChart` | `components/ErrorChart.tsx:25` | Client | `results`, `interpolationThreshold`, `selectedDegree`, `onSelectDegree` | Workspace | Medium |
| `ModelExplorer` | `components/ModelExplorer.tsx:24` | Client | `dataset`, `selected` | Workspace | Low |
| `AnalysisPanel` | `components/AnalysisPanel.tsx:9` | Client | `notes: string[]` | Workspace | **High — generic note list** |
| `ExperimentHistory` | `components/ExperimentHistory.tsx:13` | Client | `entries`, `onReload`, `onClear` | Workspace | Medium |

### 5.2 Private sub-components (not exported, duplicated)

| Name | Location | Duplicate of |
| --- | --- | --- |
| `Field` | `ExperimentSettings.tsx:168` | unique |
| `Stat` | `ModelExplorer.tsx:115` | near-identical to `Item` |
| `Item` | `ExperimentSummary.tsx:64` | near-identical to `Stat` |
| `EmptyChart` | `DatasetChart.tsx:83` | same markup as the inline empty states in `ErrorChart.tsx:48-52`, `ModelExplorer.tsx:44-48`, `AnalysisPanel.tsx:14-18`, `ExperimentSummary.tsx:16-20` |

### 5.3 What is missing

There is **no design-system layer at all**: no shared `Card`, `Button`, `Slider`, `Select`, `Stat`, `EmptyState`, `Alert`, `Badge`, or `Section` component; no `components/ui/` directory; no `cn()`/`clsx` helper; no variant system. Ten of twelve components carry `"use client"`, and only `ConceptCard` is free of a `useLanguage()` call, so only `ConceptCard` and `AnalysisPanel` are portable to a second feature without modification.

---

## 6. Problems

### 6.1 Confirmed (reproduced or directly observed)

**P1 — `npm run lint` fails with 2 errors.** Reproduced (exit code 1).

```
src/components/ExperimentWorkspace.tsx:39:5  react-hooks/set-state-in-effect
src/components/LanguageProvider.tsx:42:5     react-hooks/set-state-in-effect
```

Both are `setState` called synchronously in an effect body, which React 19's lint rules flag as causing cascading renders. Because Next 16 removed `next lint`, `next build` does **not** run ESLint, so **the build passes while the codebase is lint-broken** — the failure is invisible to anyone who only runs `npm run build`.

**P2 — Misleading double-descent verdict on the default configuration.** Reproduced via `scripts/smoke-experiment.ts`. See §3.3 for the full numbers. The shipped default run reports `Possible Double Descent` while test error at the "second minimum" is ~10⁶× the best model's. For an educational product whose stated value proposition is honesty about results (`i18n.ts:137`), this is the most serious defect in the repository.

**P3 — Test error blows up to ~1.7e6 in the overparameterized regime.** Reproduced. Whatever the root cause (see the `NEEDS VERIFICATION` note in §3.3), the observable outcome is that the app's core chart shows a numerical explosion where the pedagogy promises a gentle second descent, and the log-scale axis makes it look plausible.

**P4 — Korean users see English on first paint.** Confirmed by code path: `LanguageProvider.tsx:38` initializes `locale` to `"en"`; the stored locale is only read in an effect at `:41-44`. Server-rendered HTML and the first client paint are always English, and `<html lang>` is hardcoded `"en"` at `layout.tsx:29` and only corrected in a second effect at `:48`. So a Korean user gets a visible language flash on every page load, and assistive technology briefly sees the wrong document language.

**P5 — Analysis notes are computed twice, and the stored copy is dead English.** Confirmed. `runExperiment` calls `buildAnalysisNotes` at `experiment.ts:155-159` **without a locale argument**, so it defaults to `"en"` (`analysis.ts:138`) and the English result is stored in `ExperimentResult.analysisNotes`. `ExperimentWorkspace.tsx:47-55` then recomputes the notes with the real locale and renders those instead. `result.analysisNotes` is never read by any component — wasted work on every run, plus a persisted field that will be wrong for any future consumer (export, comparison view, sharing).

**P6 — `scripts/` is excluded from typechecking.** Confirmed at `tsconfig.json:34`. The de-facto test suite (`selfcheck.ts`) and the smoke script are never typechecked by `npx tsc --noEmit`. They currently run only because `i18n.ts`'s `@/`-aliased import is `import type` (`i18n.ts:1`) and therefore stripped by Node's type stripper. **The moment any module in the `selfcheck` import graph adds a runtime import through the `@/` alias, `npm run selfcheck` breaks at runtime with no compile-time warning.**

**P7 — Reported interpolation threshold disagrees with the value the UI itself predicts.** Confirmed: default run reported threshold 75 while `ExperimentSettings.tsx:101` tells the user to expect it near degree 79. Two independent causes: the absolute `1e-3` MSE cutoff is not noise-scaled (`experiment.ts:18`), and the strided degree grid quantizes the answer (`experiment.ts:68-73`). A student comparing the hint to the result sees an unexplained discrepancy.

**P8 — Empty stray directory `ai-research-lab/` at the repository root.** Confirmed: exists on disk, contains zero files, untracked by git. Almost certainly a leftover from a `create-next-app` run inside the wrong folder. It is confusing, and it shares a name with the `package.json` `name` field.

### 6.2 Suspected (not reproduced — would need a browser or profiling)

**S1 — Main-thread jank during a sweep.** `runExperiment` yields with `await new Promise(r => setTimeout(r, 0))` between degrees (`experiment.ts:141`), but each individual fit is synchronous and O(n·p² + p³). At N=500 / degree 200 a single fit is substantial. The whole sweep took 1.1s in Node for the defaults; on a mid-range phone the worst case will be much slower and each fit blocks paint. Not reproduced in a browser.

**S2 — Unvalidated `localStorage` deserialization.** `history.ts:13` does `parsed as HistoryEntry[]` after only an `Array.isArray` check. A stale or hand-edited `v1` payload will produce runtime `undefined` access in `ExperimentHistory.tsx:48-52` (e.g. `e.config.noiseLevel.toFixed`). Not reproduced.

**S3 — Header crowding on narrow viewports.** `Header.tsx:20-39` renders three nav links plus a language toggle with no hamburger and no `hidden sm:flex`. At 320px with Korean labels this likely overflows or wraps awkwardly. Not visually verified.

**S4 — Keyboard users cannot select a model.** `ErrorChart`'s degree selection is an `onClick` on the Recharts SVG (`ErrorChart.tsx:90`); there is no keyboard-reachable alternative, so `ModelExplorer` is unreachable without a mouse. This is almost certainly a real WCAG 2.1.1 failure but was not tested with a screen reader.

**S5 — Recharts in the initial bundle.** Statically imported by three components that render nothing but a placeholder until a run completes. Next 16 no longer reports First Load JS, so the actual cost is unmeasured.

**S6 — Runtime error messages are not localized.** `ExperimentWorkspace.tsx:71-74` surfaces raw `Error.message` strings, all of which are English literals thrown from `src/lib/` (e.g. `experiment.ts:92`). A Korean user hitting a validation error sees English. Not reproduced (the reachable UI ranges may make these errors unreachable).

### 6.3 Accessibility findings

- Missing `data-scroll-behavior="smooth"` on `<html>` given `globals.css:37` (Next 16 change; see §1.2).
- `<html lang>` is wrong for Korean until an effect runs (P4).
- No skip-to-content link.
- Log/Linear toggle buttons (`ErrorChart.tsx:68-81`) are styled as a segmented control but carry no `aria-pressed`, so state is conveyed by color alone.
- Progress bar (`ExperimentSettings.tsx:154-161`) is a styled `<div>` with no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. The wrapper has `aria-live="polite"`, which will announce on every tick — likely too chatty.
- Charts expose no accessible name, description, or tabular fallback.
- Train/test series are distinguished by color only.
- Explicit `focus-visible` styling appears on exactly one element (`Hero.tsx:31`); every other button and link relies on UA defaults, several of which sit on low-contrast `text-muted`.
- No `prefers-reduced-motion` handling for smooth scroll or transitions.

---

## 7. Technical debt

| # | Item | Location | Impact |
| --- | --- | --- | --- |
| **T1** | **No test framework and no CI.** The only tests are 15 hand-rolled asserts in `scripts/selfcheck.ts`, invoked manually and typechecked by nothing. No `.github/workflows`, no pre-commit hook. Nothing prevents committing the currently-failing lint. | `scripts/selfcheck.ts`, absent `.github/` | Highest long-term risk. Every ML refactor is unguarded. |
| **T2** | **`i18n.ts` is a single 418-line, 18.7 KB file holding three parallel structures** — the `en` object, the `ko` object, and a hand-written `Messages` type — that must be edited in lockstep. It is a client-bundle string blob with no namespacing, no lazy loading, and no per-feature splitting. | `src/lib/i18n.ts` | Blocks scaling to many lessons; every new module inflates every page's bundle. |
| **T3** | **Hardcoded hex colors duplicated across all chart components** despite CSS variables existing for exactly these values. | `DatasetChart.tsx:41,67,73`; `ErrorChart.tsx:97,143,147,157,169`; `ModelExplorer.tsx:71,89,95,102`; vs `globals.css:8-13` | Theming and dark mode are blocked. |
| **T4** | **Duplicated presentational primitives.** `Stat` (`ModelExplorer.tsx:115`) and `Item` (`ExperimentSummary.tsx:64`) are the same component; the dashed empty-state block is copy-pasted five times; the card shell class string is repeated six times. | see §5.2 | Every visual tweak is a five-file change. |
| **T5** | **"Best result" is recomputed in three places** with the same reduce: `experiment.ts:161`, `ExperimentWorkspace.tsx:66-68`, `analysis.ts:149`. Likewise `nTrain = Math.floor(datasetSize × trainRatio)` appears at `experiment.ts:33`, `ExperimentSettings.tsx:28`, and `ExperimentSettings.tsx:36`. | multiple | Divergence risk; already the reason P5 exists. |
| **T6** | **Import-style inconsistency.** `src/lib/*` uses relative paths with explicit `.ts` extensions (`experiment.ts:6`, `analysis.ts:1`), while `src/components/*` uses the `@/` alias without extensions (`ExperimentWorkspace.tsx:11`). The `.ts` extensions exist only so the `scripts/` runner works, and `i18n.ts:1` breaks the pattern by using `@/` inside `lib/`. | `tsconfig.json:9`, all of `src/lib/` | Confusing; directly enables the P6 landmine. |
| **T7** | **Stray internal jargon in shipped comments** — `"Ponytail:"` at `experiment.ts:84` and `"Ceiling:"` at `linalg.ts:14` appear to be leftover authoring markers with no meaning to a reader. | `experiment.ts:84`, `linalg.ts:14` | Noise; signals unreviewed code. |
| **T8** | **create-next-app boilerplate never cleaned up**: five unused SVGs in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`), an empty `next.config.ts`, and the empty `ai-research-lab/` directory (P8). | `public/`, `next.config.ts` | Cosmetic, but ships dead assets. |
| **T9** | **Pervasive `!` non-null assertions** (roughly 90+ occurrences, densest in `linalg.ts`) used in place of enabling `noUncheckedIndexedAccess` and handling bounds properly. | `src/lib/linalg.ts` throughout | Every one is an unchecked assumption; a real out-of-bounds becomes `undefined` arithmetic → `NaN` propagation rather than a thrown error. |
| **T10** | **Unversioned, unvalidated `localStorage` schema.** The key is named `...v1` (`history.ts:3`) but there is no migration path and no runtime validation (S2). `HistoryEntry.testErrorCurve` is stored speculatively for a comparison feature that does not exist (`types/experiment.ts:64-65`). | `src/lib/history.ts` | Future schema change silently corrupts returning users' history. |
| **T11** | **Magic numbers without provenance.** `DD_THRESHOLDS` (`analysis.ts:5-11`), `RIDGE`/`RCOND` (`linalg.ts:11,17`), `INTERPOLATION_MSE_THRESHOLD`/`TARGET_GRID_POINTS`/`DENSE_WINDOW` (`experiment.ts:18-28`). They are at least centralized and commented, which is better than average — but none is justified by a citation or a calibration test. | `analysis.ts`, `linalg.ts`, `experiment.ts` | Scientific credibility of the whole product rests on these. |
| **T12** | **No formatter, no editor config, no Node version pin.** The codebase is consistently formatted by convention only. | absent | Will produce diff noise as soon as a second contributor appears. |

---

## 8. Architecture risks

Ordered by severity for the stated goal of growing this into a full curriculum-style learning platform.

**R1 — The domain model is hardcoded to one experiment; there is no concept of a "lesson" or "module." (Biggest risk.)**
`ExperimentConfig` (`types/experiment.ts:6-12`) has exactly five fields — `datasetSize`, `noiseLevel`, `maxComplexity`, `trainRatio`, `randomSeed` — all specific to polynomial-regression double descent. `ExperimentResult` embeds `ModelResult[]` with a `degree` field. `ExperimentSummaryData` has a `doubleDescentStatus` field. `ExperimentSettings`, `ExperimentSummary`, `ErrorChart`, and `ModelExplorer` all consume these concrete types directly. Adding a second topic (say, bias–variance, gradient descent, or regularization) requires either a parallel copy of the entire stack or a disruptive generalization of every type and every component simultaneously. There is no `Experiment` interface, no plugin registry, no `Lesson` entity, no progress model, and no content abstraction. **This is the single change that must happen before any second ML module is written.**

**R2 — Single-route, single-page architecture with no content system.**
Everything lives at `/` behind hash anchors. A curriculum needs `/lessons/[slug]`, per-lesson metadata, SEO, deep links, and prev/next navigation. Today there is no dynamic route, no MDX or content pipeline, no frontmatter, no `generateStaticParams`, and no `generateMetadata`. Adding routing later also means migrating every `<a href="#...">` to `next/link` and revisiting the Next 16 scroll-behavior change (§1.2).

**R3 — Whole-app client rendering forfeits the framework's main advantage.**
`page.tsx:1` marks the root page `"use client"`, so all prose content — which for a curriculum platform will be the overwhelming majority of bytes and the entire SEO surface — ships as client JavaScript rather than server-rendered HTML. Combined with the monolithic `i18n.ts` (T2) and static Recharts imports (S5), the bundle grows linearly with curriculum size. Fixing this after twenty lessons exist is far more expensive than fixing it now: the correct shape is server-rendered lesson content with small client islands for the interactive widgets.

**R4 — Compute lives on the render thread with no isolation boundary.**
`runExperiment` (`experiment.ts:87`) runs numerics in the same thread as React, cooperating only via `setTimeout(0)` yields. There is no Web Worker, no cancellation (starting a run cannot abort a previous one), and no timeout. More ambitious modules — gradient descent animation, small neural nets, larger sweeps — will not fit this model. A worker boundary is much cheaper to introduce now, while there is exactly one engine, than later across many.

**R5 — Scientific-credibility risk with no automated defense.**
The product's differentiator is that it reports only what a run actually shows — and it currently violates that on its own defaults (P2). Meanwhile the numerical core is guarded by 15 asserts that are neither typechecked (P6) nor run by CI (T1). As the library of modules grows, the probability that some module quietly displays a wrong claim approaches one. Every ML module needs property-based or golden-value tests running in CI before it ships.

**R6 — i18n does not scale, and locale is client-only.**
Every string for every future lesson would land in one file loaded on every page (T2), and locale is resolved after hydration (P4) rather than via routing or a cookie. Next 16's internationalization guidance (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`) points toward route-based or middleware-based locale resolution; retrofitting that across many lesson routes is far harder than adopting it now.

**R7 — No persistence or identity story.**
`localStorage` only (T10), unversioned, per-browser. A curriculum platform implies progress tracking, resumable state, and eventually accounts. There is currently no server, no API route, and no data layer, so this is a from-scratch addition rather than an extension.

**R8 — No error boundaries or route-level error handling.**
The only error surface is a `try/catch` around `runExperiment` (`ExperimentWorkspace.tsx:71`). There is no `error.tsx`, no `global-error.tsx`, no React error boundary. A render-time throw anywhere in the client tree — including `useLanguage()` outside a provider (`LanguageProvider.tsx:82`) — blanks the page.

---

## 9. Recommended improvements

Grouped by intent. Each is a recommendation only; nothing here has been implemented.

### 9.1 Correctness and credibility (must precede any new content)

1. **Diagnose and fix the overparameterized blow-up (P3).** Measure coefficient norm, residual, and condition number as a function of degree for the default config. Likely fixes, in order of preference: scale the ridge relative to `trace(K)/n` instead of using a fixed `1e-10`; or route `p > n` through a proper SVD-based pseudo-inverse rather than Gaussian elimination on `XXᵀ`; or lower `RCOND` gating so the Jacobi fallback actually engages. Add a regression test asserting that test MSE at `degree = 2n` stays within a sane multiple of the best test MSE.
2. **Add an absolute sanity gate to the "Possible Double Descent" tier (P2)** — e.g. require `secondMin < firstMin × k` for some `k` near 1, matching what the "Clear" tier already requires. Until the underlying numerics are fixed, the honest verdict for the default run is "No Clear Double Descent."
3. **Calibrate `DD_THRESHOLDS`** against a set of curves with known ground truth, and record the calibration in a test so the constants stop being unexplained magic numbers.
4. **Make the interpolation-threshold detector noise-aware (P7)** — compare train MSE against a fraction of the noise variance rather than a fixed `1e-3`, and either report the bracketing degrees or refine within the stride so the reported value agrees with the UI's own prediction.
5. **Remove the duplicate, always-English `buildAnalysisNotes` call (P5).** Either drop `analysisNotes` from `ExperimentResult` entirely and compute it only in the component, or thread the locale through and drop the component-side recomputation. Do not keep both.
6. **Validate `localStorage` payloads at the boundary (S2)** with a small runtime schema check, and define a migration path for the `v1` key.

### 9.2 Green build

7. **Fix the two lint errors (P1).** For `LanguageProvider`, read the stored locale during lazy `useState` initialization guarded by a `typeof window` check, or move locale to a cookie so the server can render it correctly — which also fixes P4. For `ExperimentWorkspace`, the same lazy-initializer pattern applies to history.
8. **Make lint and typecheck non-bypassable.** Add `"typecheck": "tsc --noEmit"` and a `"check"` script chaining typecheck + lint + selfcheck, and wire it into CI. Remember that `next build` will not do this for you in Next 16.
9. **Stop excluding `scripts/` from `tsconfig.json` (P6),** or give `scripts/` its own tsconfig. Either way, remove the silent trap where an aliased runtime import breaks `selfcheck` with no compile-time signal.

### 9.3 Foundation for scaling

10. **Introduce a real testing setup (T1).** Vitest is the lowest-friction choice given the Vite-free but ESM-native codebase; migrate `selfcheck.ts` into it, add property tests for the linear algebra (min-norm property, interpolation, reproducibility), and add golden-value tests for `analyzeDoubleDescent`.
11. **Add CI** running typecheck, lint, tests, and build on every push.
12. **Extract a `components/ui/` design layer** — `Card`, `Section`, `Button`, `Stat`, `EmptyState`, `Field`, `Alert` — and collapse the duplicates catalogued in §5.2 and T4.
13. **Replace hardcoded chart hex values with the existing CSS variables (T3)** via a small `chartTheme` module that reads computed custom properties, then add a dark theme.
14. **Define a topic-agnostic experiment abstraction (R1)** before writing a second module: something like `ExperimentDefinition<TConfig, TResult>` with `defaultConfig`, `parameterSchema` (driving a generic settings renderer), `run`, `analyze`, and a declarative list of visualizations. Move double descent to be the first implementation of it.
15. **Move numerics into a Web Worker (R4)** with cancellation and progress messaging, behind an interface that any future module can reuse.
16. **Introduce lesson routing and a content pipeline (R2)** — `/lessons/[slug]` with `generateStaticParams` and `generateMetadata`, and MDX or a typed content collection for prose, so that lesson text is server-rendered and does not inflate the client bundle.
17. **Un-client the page shell (R3).** Keep `page.tsx` and the prose sections as Server Components and push `"use client"` down to `ExperimentWorkspace`, the charts, and the language toggle.
18. **Split i18n per feature/lesson (T2, R6)** and move locale resolution to routing or a cookie so the server renders the right language on first paint.
19. **Work through the accessibility list in §6.3** — `data-scroll-behavior`, skip link, `aria-pressed` on the scale toggle, a proper `progressbar` role, accessible chart names plus a data-table fallback, a keyboard path to degree selection (a labeled range input or a table of degrees would solve S4 cleanly), visible focus styles, and `prefers-reduced-motion`.
20. **Lazy-load Recharts** with `next/dynamic` and a `Suspense` skeleton (S5).
21. **Add `error.tsx` / `global-error.tsx` and a React error boundary around the workspace (R8).**
22. **Housekeeping:** delete the empty `ai-research-lab/` directory (P8), remove the unused boilerplate SVGs, strip the stray `"Ponytail:"` / `"Ceiling:"` comment markers (T7), unify import style (T6), and add Prettier plus an `.nvmrc` (T12).
23. **Consider enabling `reactCompiler`** (`version-16.md:395`) once the component tree is stable — the chart-heavy render surface is a good fit — and evaluate `noUncheckedIndexedAccess` to retire the `!` assertions (T9).

---

## 10. Recommended development order

The ordering principle: **do not add content on top of a foundation that is producing incorrect claims, and do not generalize the architecture while the build is red.** Stages 1–2 are prerequisites for everything else; stage 3 is the last cheap moment to change the architecture.

### Stage 0 — Housekeeping (hours)
Delete the empty `ai-research-lab/` directory and the unused boilerplate SVGs; strip the stray comment markers; add `typecheck` and `check` npm scripts. Zero-risk changes that make everything after this legible.
*Done when:* `npm run check` exists and reports the current true state.

### Stage 1 — Make the build green and trustworthy (1–2 days)
Fix the two `set-state-in-effect` lint errors (P1), which also fixes the Korean flash-of-English (P4) if you move locale resolution to a cookie or lazy initializer. Stop excluding `scripts/` from typechecking (P6). Stand up Vitest, port `selfcheck.ts` into it, and add CI running typecheck + lint + test + build.
*Done when:* typecheck, lint, tests, and build all pass in CI, and a regression cannot be merged silently.
*Why first:* every subsequent change to the numerics is unsafe without this, and it is the cheapest stage.

### Stage 2 — Fix the science (3–5 days)
This is the highest-value work in the audit. Diagnose the high-degree blow-up (P3) — start by measuring coefficient norms and Gram-matrix conditioning across degrees, which is the `NEEDS VERIFICATION` item from §3.3. Fix the estimator (adaptive ridge or a real SVD path). Add the absolute sanity gate to the "Possible" verdict (P2). Make the interpolation-threshold detector noise-aware (P7). Remove the duplicate English `buildAnalysisNotes` call (P5). Add property tests and golden-value tests for all of it. Then answer the open question: **can this setup produce a genuine second descent at all?** If it cannot, change the estimator or reframe the module honestly before building anything on top of it.
*Done when:* the default configuration produces either a defensible double-descent curve or an honest "No Clear Double Descent," and tests lock that in.
*Why here:* the product's entire claim is that it does not fabricate results. Shipping more modules while the flagship one overstates its findings compounds the credibility problem across the whole curriculum.

### Stage 3 — Generalize the architecture (1–2 weeks)
Now, while there is exactly one module to migrate, do the structural work: extract `components/ui/` (T4), move chart colors to theme tokens (T3), define the topic-agnostic `ExperimentDefinition` abstraction (R1) and re-express double descent through it, move numerics into a cancellable Web Worker (R4), un-client the page shell (R3), and add `error.tsx` plus an error boundary (R8).
*Done when:* double descent is one registered module among a schema that could hold others, and adding a second module requires no changes to shared components.
*Why here:* this is the last point at which the migration cost is one module rather than N.

### Stage 4 — Curriculum shell (1–2 weeks)
Add `/lessons/[slug]` routing with `generateStaticParams` and `generateMetadata`, an MDX or typed content pipeline for prose, per-lesson i18n namespaces with server-side locale resolution (T2, R6), lesson navigation, and a landing page that lists modules. Migrate the existing concept/about copy into the content system.
*Done when:* the double-descent module is reachable at its own URL, server-rendered, deep-linkable, and indexable.

### Stage 5 — Second ML module (1–2 weeks)
Only now write a second topic — bias–variance decomposition or regularization paths are natural neighbors that reuse the same regression engine. Building it is the real test of whether the Stage 3 abstraction holds; expect to refine it.
*Done when:* the second module ships without modifying any shared component.

### Stage 6 — Accessibility, performance, and polish (ongoing, start earlier if resourced)
Work the §6.3 list, lazy-load Recharts, add dark mode, add `prefers-reduced-motion`, and measure with Lighthouse (necessary because Next 16 no longer reports First Load JS). Note that the keyboard-access gap (S4) is a real barrier for some students — if the platform has any accessibility commitment, pull that specific item forward into Stage 3.

### Deferred
Accounts, server persistence, progress tracking, and experiment sharing (R7). These are worth designing for in Stage 4's data shapes but not worth building until the curriculum has enough content to justify a backend.
