"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  BV_DEFAULTS,
  BV_DEGREES,
  BV_M_CHOICES,
  BV_N_CHOICES,
  runBiasVariance,
  sliceAtDegree,
  type BvConfig,
  type BvRun,
} from "@/lib/biasVariance";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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

function clip(y: number): number {
  return Math.max(-4, Math.min(4, y));
}

export default function BiasVarianceLab() {
  const { t } = useLanguage();
  const b = t.bv;
  const [draft, setDraft] = useState<BvConfig>(BV_DEFAULTS);
  const [committed, setCommitted] = useState<BvConfig>(BV_DEFAULTS);
  const [degree, setDegree] = useState(3);
  const run: BvRun = useMemo(() => runBiasVariance(committed), [committed]);
  const slice = sliceAtDegree(run, degree);
  const spaghetti = run.grid.map((x, i) => {
    const row: Record<string, number> = {
      x,
      truth: clip(run.truth[i]!),
      mean: clip(slice.mean[i]!),
    };
    for (let m = 0; m < slice.spaghetti.length; m++) {
      row[`m${m}`] = clip(slice.spaghetti[m]![i]!);
    }
    return row;
  });
  const stacked = run.slices.map((item) => ({
    degree: item.degree,
    bias2: item.meanDebiasedBias2,
    variance: item.meanVariance,
    noise: run.sigma2,
    direct: item.meanDirectError,
    stacked: item.meanDebiasedBias2 + item.meanVariance + run.sigma2,
  }));
  const smallM = committed.M === 8;

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {b.title}
      </h3>
      <p className="text-sm text-muted">{b.guide}</p>
      <p className="text-xs text-muted">{b.notHoldout}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted">
          {b.degree} ({degree})
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={degree}
            onChange={(event) => setDegree(Number(event.target.value))}
          >
            {BV_DEGREES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          M
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={draft.M}
            onChange={(event) =>
              setDraft((current) => ({ ...current, M: Number(event.target.value) }))
            }
          >
            {BV_M_CHOICES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          n
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={draft.n}
            onChange={(event) =>
              setDraft((current) => ({ ...current, n: Number(event.target.value) }))
            }
          >
            {BV_N_CHOICES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          {b.noise} ({draft.sigma.toFixed(2)})
          <input
            type="range"
            className="mt-1 w-full accent-accent"
            min={0}
            max={0.8}
            step={0.05}
            value={draft.sigma}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sigma: Number(event.target.value),
              }))
            }
          />
        </label>
      </div>
      <label className="block text-xs text-muted">
        {b.seed}
        <input
          type="number"
          className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
          value={draft.seed}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              seed: Number(event.target.value) || 0,
            }))
          }
        />
      </label>
      <button
        type="button"
        className="press press-primary press-sm"
        onClick={() => setCommitted({ ...draft })}
      >
        {b.run}
      </button>
      {smallM && <p className="text-xs text-muted">{b.smallM}</p>}

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label={b.bias2} value={slice.meanDebiasedBias2.toExponential(3)} />
        <Stat label={b.variance} value={slice.meanVariance.toExponential(3)} />
        <Stat label="σ²" value={run.sigma2.toExponential(3)} />
        <Stat
          label={b.direct}
          value={slice.meanDirectError.toExponential(3)}
        />
      </dl>

      <div className="h-56 w-full">
        <p className="text-xs text-muted">{b.spaghetti}</p>
        <ResponsiveContainer>
          <LineChart data={spaghetti} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} />
            <YAxis domain={[-4, 4]} tick={{ fontSize: 10 }} width={36} />
            {slice.spaghetti.map((_, m) => (
              <Line
                key={m}
                type="monotone"
                dataKey={`m${m}`}
                stroke="#94a3b8"
                strokeOpacity={0.35}
                dot={false}
                isAnimationActive={false}
                legendType="none"
              />
            ))}
            <Line
              type="monotone"
              dataKey="truth"
              stroke="#111"
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mean"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-56 w-full">
        <p className="text-xs text-muted">{b.bars}</p>
        <ResponsiveContainer>
          <BarChart data={stacked} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
            <XAxis dataKey="degree" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Legend />
            <Bar dataKey="bias2" stackId="decomp" fill="#1d4ed8" name={b.bias2} isAnimationActive={false} />
            <Bar dataKey="variance" stackId="decomp" fill="#f59e0b" name={b.variance} isAnimationActive={false} />
            <Bar dataKey="noise" stackId="decomp" fill="#a8a29e" name="σ²" isAnimationActive={false} />
            <ReferenceLine
              x={degree}
              stroke="#111"
              strokeDasharray="3 3"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-extrabold text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
