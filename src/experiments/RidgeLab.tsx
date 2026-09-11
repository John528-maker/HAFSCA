"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { chartTheme } from "@/lib/chartTheme";
import { cubicTruth, generateCubicDataset, splitCubic } from "@/lib/overfit";
import {
  RIDGE_DEFAULTS,
  RIDGE_LOG_RHO_MAX,
  RIDGE_LOG_RHO_MIN,
  fitPolynomialRelativeRidge,
  runRidgePath,
} from "@/lib/ridge";
import { predict } from "@/lib/regression";
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

/** Distinct series strokes from theme + a short palette for coefficients. */
const COEF_STROKES = [
  chartTheme.foregroundHex,
  chartTheme.trainHex,
  chartTheme.testHex,
  chartTheme.truthHex,
  chartTheme.thresholdHex,
  chartTheme.validHex,
  "#0f766e",
  "#4b5563",
  "#ea580c",
  "#65a30d",
  "#be123c",
  "#7c2d12",
  "#1e3a8a",
];

export default function RidgeLab() {
  const { t } = useLanguage();
  const r = t.ridge;
  const [degree, setDegree] = useState<number>(RIDGE_DEFAULTS.degree);
  const [log10Rho, setLog10Rho] = useState<number>(RIDGE_DEFAULTS.log10Rho);
  const [noise, setNoise] = useState<number>(RIDGE_DEFAULTS.noiseLevel);
  const [seed, setSeed] = useState<number>(RIDGE_DEFAULTS.randomSeed);

  const config = useMemo(
    () => ({
      degree,
      datasetSize: RIDGE_DEFAULTS.datasetSize,
      trainRatio: RIDGE_DEFAULTS.trainRatio,
      noiseLevel: noise,
      randomSeed: seed,
    }),
    [degree, noise, seed],
  );
  const run = useMemo(() => runRidgePath(config), [config]);
  const dataset = useMemo(
    () =>
      splitCubic(
        generateCubicDataset(RIDGE_DEFAULTS.datasetSize, noise, seed),
        RIDGE_DEFAULTS.trainRatio,
        seed,
      ),
    [noise, seed],
  );
  const rho = 10 ** log10Rho;
  const live = useMemo(() => {
    const trainX = dataset.train.map((point) => point.x);
    const trainY = dataset.train.map((point) => point.y);
    return fitPolynomialRelativeRidge(trainX, trainY, degree, rho);
  }, [dataset, degree, rho]);

  const nearest = run.path.reduce((a, b) =>
    Math.abs(b.log10Rho - log10Rho) < Math.abs(a.log10Rho - log10Rho) ? b : a,
  );
  const coefData = run.path.map((point) => {
    const row: Record<string, number> = { log10Rho: point.log10Rho };
    point.coefficients.forEach((value, k) => {
      row[`t${k}`] = value;
    });
    return row;
  });
  const curveGrid = useMemo(() => {
    const xs: number[] = [];
    for (let i = 0; i < 161; i++) xs.push(-1 + (2 * i) / 160);
    const pred = predict(live, xs);
    return xs.map((x, i) => ({
      x,
      truth: cubicTruth(x),
      fit: pred[i]!,
    }));
  }, [live]);

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {r.title}
      </h3>
      <p className="text-sm text-muted">{r.guide}</p>
      <p className="text-xs text-muted">{r.relative}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted">
          {r.rhoLabel} · log₁₀ ρ ({log10Rho.toFixed(2)})
          <input
            type="range"
            className="mt-1 w-full accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            min={RIDGE_LOG_RHO_MIN}
            max={RIDGE_LOG_RHO_MAX}
            step={0.05}
            value={log10Rho}
            onChange={(event) => setLog10Rho(Number(event.target.value))}
          />
        </label>
        <label className="text-xs text-muted">
          {r.degree} ({degree})
          <input
            type="range"
            className="mt-1 w-full accent-accent"
            min={3}
            max={12}
            step={1}
            value={degree}
            onChange={(event) => setDegree(Math.round(Number(event.target.value)))}
          />
        </label>
        <label className="text-xs text-muted">
          {r.noise} ({noise.toFixed(2)})
          <input
            type="range"
            className="mt-1 w-full accent-accent"
            min={0}
            max={0.5}
            step={0.05}
            value={noise}
            onChange={(event) => setNoise(Number(event.target.value))}
          />
        </label>
        <label className="text-xs text-muted">
          {r.seed}
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 0)}
          />
        </label>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label={r.rhoLabel} value={rho.toExponential(2)} />
        <Stat
          label={r.lambdaLabel}
          value={live.lambda.toExponential(2)}
        />
        <Stat label="‖θ‖₂" value={nearest.coefNorm.toExponential(2)} />
        <Stat label={r.train} value={nearest.trainMSE.toExponential(3)} />
        <Stat label={r.test} value={nearest.testMSE.toExponential(3)} />
      </dl>
      <p className="text-xs text-muted">
        {run.hasInteriorDip ? r.dip : r.noDip} {r.axis}
      </p>
      <p className="text-xs text-muted">{r.shrinkNote}</p>

      <div className="h-52 w-full">
        <p className="text-xs text-muted">{r.curve}</p>
        <ResponsiveContainer>
          <LineChart data={curveGrid} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} />
            <YAxis domain={[-3, 3]} tick={{ fontSize: 10 }} width={36} />
            <Line
              type="monotone"
              dataKey="truth"
              stroke={chartTheme.truthHex}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="fit"
              stroke={chartTheme.testHex}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-52 w-full">
        <p className="text-xs text-muted">{r.mse}</p>
        <ResponsiveContainer>
          <LineChart data={run.path} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
            <XAxis dataKey="log10Rho" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={44} className="tabular-nums" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="trainMSE"
              stroke={chartTheme.trainHex}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              name={r.train}
            />
            <Line
              type="monotone"
              dataKey="testMSE"
              stroke={chartTheme.testHex}
              dot={{ r: 2 }}
              isAnimationActive={false}
              name={r.test}
            />
            <ReferenceLine x={log10Rho} stroke={chartTheme.foregroundHex} strokeDasharray="3 3" />
            <ReferenceLine
              x={run.bestLog10Rho}
              stroke={chartTheme.truthHex}
              strokeDasharray="2 2"
              label={{
                value: r.test,
                position: "insideTopLeft",
                fontSize: 10,
                fill: chartTheme.truthHex,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-52 w-full">
        <p className="text-xs text-muted">{r.coefs}</p>
        <ResponsiveContainer>
          <LineChart data={coefData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
            <XAxis dataKey="log10Rho" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={44} />
            <ReferenceLine x={log10Rho} stroke={chartTheme.foregroundHex} strokeDasharray="3 3" />
            {Array.from({ length: degree + 1 }, (_, k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={`t${k}`}
                stroke={COEF_STROKES[k % COEF_STROKES.length]}
                dot={false}
                isAnimationActive={false}
                strokeWidth={k === 0 ? 1.5 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-1.5">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  );
}
