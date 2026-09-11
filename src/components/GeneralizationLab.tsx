"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  GEN_DEFAULTS,
  runGeneralizationExperiment,
  type GenRun,
} from "@/lib/generalization";
import { chartTheme } from "@/lib/chartTheme";
import { MAX_U_CURVE_DEGREE } from "@/lib/overfit";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function GeneralizationLab() {
  const { t } = useLanguage();
  const g = t.gen;
  const [seed, setSeed] = useState<number>(GEN_DEFAULTS.randomSeed);
  const [noise, setNoise] = useState<number>(GEN_DEFAULTS.noiseLevel);

  const run: GenRun = useMemo(
    () =>
      runGeneralizationExperiment({
        randomSeed: seed,
        noiseLevel: noise,
        maxDegree: MAX_U_CURVE_DEGREE,
      }),
    [seed, noise],
  );

  const peeked =
    run.testMseAtTestPick < run.testMseAtValidPick * 0.98 &&
    run.degreeByTest !== run.degreeByValid;

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">{g.title}</h3>
      <p className="text-sm text-muted">{g.guide}</p>
      <div className="flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          {g.seed}
          <input
            type="number"
            className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 0)}
          />
        </label>
        <label className="text-xs text-muted">
          {g.noise} ({noise.toFixed(2)})
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

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted">{g.nTrain}</dt>
          <dd className="font-medium tabular-nums">{run.split.train.length}</dd>
        </div>
        <div>
          <dt className="text-muted">{g.nValid}</dt>
          <dd className="font-medium tabular-nums">{run.split.valid.length}</dd>
        </div>
        <div>
          <dt className="text-muted">{g.nTest}</dt>
          <dd className="font-medium tabular-nums">{run.split.test.length}</dd>
        </div>
        <div>
          <dt className="text-muted">{g.honest}</dt>
          <dd className="font-medium tabular-nums">
            d={run.degreeByValid} → test {run.testMseAtValidPick.toExponential(2)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">{g.peek}</dt>
          <dd className="font-medium tabular-nums">
            d={run.degreeByTest} → test {run.testMseAtTestPick.toExponential(2)}
          </dd>
        </div>
      </dl>
      {peeked && <p className="text-sm text-threshold">{g.aha}</p>}
      <p className="text-xs text-muted">{g.caption}</p>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={run.rows} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
            <XAxis dataKey="degree" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={52}
              tickFormatter={(v: number) =>
                v >= 0.01 ? v.toPrecision(2) : v.toExponential(0)
              }
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? value.toExponential(3) : String(value)
              }
            />
            <Legend />
            <ReferenceLine
              x={run.degreeByValid}
              stroke={chartTheme.validHex}
              strokeDasharray="4 4"
              label={{ value: g.validPick, fill: chartTheme.validHex, fontSize: 11 }}
            />
            <ReferenceLine
              x={run.degreeByTest}
              stroke={chartTheme.testHex}
              strokeDasharray="2 3"
              label={{ value: g.testPick, fill: chartTheme.testHex, fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="trainMSE"
              name={g.train}
              stroke={chartTheme.trainHex}
              strokeWidth={2}
              dot={{ r: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="validMSE"
              name={g.valid}
              stroke={chartTheme.validHex}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="testMSE"
              name={g.test}
              stroke={chartTheme.testHex}
              strokeWidth={2}
              dot={{ r: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
