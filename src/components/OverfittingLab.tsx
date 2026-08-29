"use client";

import ErrorChart from "@/components/ErrorChart";
import { useLanguage } from "@/components/LanguageProvider";
import {
  MAX_U_CURVE_DEGREE,
  OVERFIT_DEFAULTS,
  runOverfitExperiment,
  type OverfitRun,
} from "@/lib/overfit";
import { useMemo, useState } from "react";

export default function OverfittingLab() {
  const { t } = useLanguage();
  const o = t.overfit;
  const [seed, setSeed] = useState(OVERFIT_DEFAULTS.randomSeed);
  const [noise, setNoise] = useState(OVERFIT_DEFAULTS.noiseLevel);
  const [selected, setSelected] = useState<number | null>(null);

  const run: OverfitRun = useMemo(
    () =>
      runOverfitExperiment({
        ...OVERFIT_DEFAULTS,
        randomSeed: seed,
        noiseLevel: noise,
        maxDegree: MAX_U_CURVE_DEGREE,
      }),
    [seed, noise],
  );

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {o.title}
      </h3>
      <p className="text-sm text-muted">{o.plateau}</p>
      <p className="text-sm text-muted">
        {run.note === "no-sweet-spot" ? o.noSweet : o.uCurve}{" "}
        {o.best(run.bestDegree, MAX_U_CURVE_DEGREE)}
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          {o.seed}
          <input
            type="number"
            className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 0)}
          />
        </label>
        <label className="text-xs text-muted">
          {o.noise} ({noise.toFixed(2)})
          <input
            type="range"
            className="ml-2 align-middle"
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
        selectedDegree={selected}
        onSelectDegree={setSelected}
      />
    </div>
  );
}
