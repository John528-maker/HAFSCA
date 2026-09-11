"use client";

import ErrorChart from "@/components/ErrorChart";
import ModelExplorer from "@/components/ModelExplorer";
import { useLanguage } from "@/components/LanguageProvider";
import { chartTheme } from "@/lib/chartTheme";
import { cubicTruth, MAX_U_CURVE_DEGREE, OVERFIT_DEFAULTS, runOverfitExperiment } from "@/lib/overfit";
import { predict } from "@/lib/regression";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function OverfittingLab() {
  const { t } = useLanguage();
  const o = t.overfit;
  const [seed, setSeed] = useState(OVERFIT_DEFAULTS.randomSeed);
  const [noise, setNoise] = useState(OVERFIT_DEFAULTS.noiseLevel);
  const [degree, setDegree] = useState(3);

  const run = useMemo(
    () =>
      runOverfitExperiment({
        ...OVERFIT_DEFAULTS,
        randomSeed: seed,
        noiseLevel: noise,
        maxDegree: MAX_U_CURVE_DEGREE,
      }),
    [seed, noise],
  );

  const selected = run.results.find((row) => row.degree === degree) ?? null;

  const truthCurve = useMemo(() => {
    const xs: number[] = [];
    for (let i = 0; i <= 200; i++) xs.push(-1 + (2 * i) / 200);
    return xs.map((x) => ({ x, truth: cubicTruth(x) }));
  }, []);

  const fitCurve = useMemo(() => {
    if (!selected) return [];
    const xs = truthCurve.map((p) => p.x);
    const ys = predict(
      {
        degree: selected.degree,
        coefficients: selected.coefficients,
        paramCount: selected.paramCount,
      },
      xs,
    );
    return xs.map((x, i) => ({ x, fit: ys[i]! }));
  }, [selected, truthCurve]);

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">{o.title}</h3>
      <p className="text-sm text-muted">{o.plateau}</p>
      <p className="text-sm text-muted">
        {run.note === "no-sweet-spot" ? o.noSweet : o.uCurve}{" "}
        {o.best(run.bestDegree, MAX_U_CURVE_DEGREE)}
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          {o.degree} ({degree})
          <input
            type="range"
            className="ml-2 align-middle accent-accent"
            min={0}
            max={MAX_U_CURVE_DEGREE}
            step={1}
            value={degree}
            onChange={(event) => setDegree(Number(event.target.value))}
            aria-valuemin={0}
            aria-valuemax={MAX_U_CURVE_DEGREE}
            aria-valuenow={degree}
          />
        </label>
        <label className="text-xs text-muted">
          {o.seed}
          <input
            type="number"
            className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 0)}
          />
        </label>
        <label className="text-xs text-muted">
          {o.noise} ({noise.toFixed(2)})
          <input
            type="range"
            className="ml-2 align-middle accent-accent"
            min={0}
            max={0.5}
            step={0.05}
            value={noise}
            onChange={(event) => setNoise(Number(event.target.value))}
          />
        </label>
      </div>

      <ErrorChart
        results={run.results}
        interpolationThreshold={null}
        selectedDegree={degree}
        onSelectDegree={setDegree}
        defaultLogScale={false}
        showDegreeSelect
      />

      <div className="card-3d bg-background p-4">
        <h4 className="text-sm font-medium">{o.fitTitle(degree)}</h4>
        <p className="mt-1 text-xs text-muted">{o.fitHint}</p>
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-1.05, 1.05]}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[-4, 4]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? value.toFixed(3) : String(value)
                }
              />
              <Legend />
              <Scatter
                name={o.train}
                data={run.dataset.train}
                fill={chartTheme.trainHex}
                fillOpacity={0.55}
              />
              <Scatter
                name={o.test}
                data={run.dataset.test}
                fill={chartTheme.testHex}
                fillOpacity={0.55}
              />
              <Line
                name={o.truth}
                data={truthCurve}
                type="monotone"
                dataKey="truth"
                stroke={chartTheme.truthHex}
                strokeDasharray="6 4"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                name={o.fit}
                data={fitCurve}
                type="monotone"
                dataKey="fit"
                stroke={chartTheme.foregroundHex}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ModelExplorer dataset={run.dataset} selected={selected} />
    </div>
  );
}
