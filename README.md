# AI Research Lab

Interactive machine-learning experiment platform. This MVP focuses on **double descent** with polynomial regression: change dataset size and noise, sweep model complexity, and inspect training vs test error — including the interpolation threshold.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run selfcheck` | Assert-based checks for the ML core (no test framework) |

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS
- Recharts
- Browser-only ML (Chebyshev polynomial features + minimum-norm least squares)
- Experiment history in `localStorage`

## Notes

- Model complexity is polynomial degree. Features use a Chebyshev basis with arcsine-distributed inputs (same span as monomials; stable at high degree).
- Default max complexity scales with training-set size so the interpolation threshold is reachable.
- Double descent is reported only when the test-error curve supports it (`Clear` / `Possible` / `No Clear`).
