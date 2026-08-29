"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  GD_DEFAULTS,
  gdStatus,
  generateGdDataset,
  hessianEigs,
  linearHessian,
  linearLoss,
  olsLinear,
  runGradientDescent,
  type GdPoint,
} from "@/lib/gd";
import { useEffect, useMemo, useRef, useState } from "react";

const W_MIN = -2.5;
const W_MAX = 2.5;
const B_MIN = -2.5;
const B_MAX = 2.5;
const GRID = 72;

export default function GradientDescentLab() {
  const { t } = useLanguage();
  const g = t.gd;
  const [alpha, setAlpha] = useState<number>(GD_DEFAULTS.alpha);
  const [scale, setScale] = useState<number>(GD_DEFAULTS.scale);
  const [w0, setW0] = useState<number>(GD_DEFAULTS.w0);
  const [b0, setB0] = useState<number>(GD_DEFAULTS.b0);
  const [iterations, setIterations] = useState<number>(GD_DEFAULTS.iterations);
  const [noise, setNoise] = useState<number>(GD_DEFAULTS.noise);
  const [seed, setSeed] = useState<number>(GD_DEFAULTS.seed);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runIdentity = `${seed}:${noise}:${scale}:${alpha}:${w0}:${b0}:${iterations}`;
  const [play, setPlay] = useState({ identity: runIdentity, cursor: 0, playing: false });
  if (play.identity !== runIdentity) {
    setPlay({ identity: runIdentity, cursor: 0, playing: false });
  }
  const { cursor, playing } = play.identity === runIdentity ? play : { cursor: 0, playing: false };

  const data = useMemo(
    () => generateGdDataset(seed, noise, scale),
    [seed, noise, scale],
  );
  const hess = useMemo(() => linearHessian(data.x), [data]);
  const eigs = useMemo(() => hessianEigs(hess), [hess]);
  const alphaCrit = 2 / eigs.lambdaMax;
  const alphaOsc = 1 / eigs.lambdaMax;
  const status = gdStatus(alpha, eigs.lambdaMax);
  const ols = useMemo(() => olsLinear(data.x, data.y), [data]);

  const run = useMemo(
    () => runGradientDescent(data.x, data.y, w0, b0, alpha, iterations),
    [data, w0, b0, alpha, iterations],
  );

  const point: GdPoint | undefined = run.path[Math.min(cursor, run.path.length - 1)];

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setPlay((current) => {
        if (current.cursor >= run.path.length - 1) {
          return { ...current, playing: false };
        }
        return { ...current, cursor: current.cursor + 1 };
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [playing, run.path.length]);

  const grid = useMemo(() => {
    const values: number[] = [];
    for (let j = 0; j < GRID; j++) {
      const b = B_MAX - ((j + 0.5) / GRID) * (B_MAX - B_MIN);
      for (let i = 0; i < GRID; i++) {
        const w = W_MIN + ((i + 0.5) / GRID) * (W_MAX - W_MIN);
        values.push(linearLoss(w, b, data.x, data.y));
      }
    }
    const sorted = [...values].sort((a, b) => a - b);
    const clip = sorted[Math.floor(0.95 * (sorted.length - 1))]! || 1;
    return { values, clip };
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { values, clip } = grid;
    const image = ctx.createImageData(GRID, GRID);
    for (let k = 0; k < values.length; k++) {
      const t = Math.min(1, values[k]! / clip);
      const r = Math.round(20 + 200 * t);
      const gch = Math.round(40 + 80 * (1 - t));
      const bch = Math.round(180 - 140 * t);
      image.data[k * 4] = r;
      image.data[k * 4 + 1] = gch;
      image.data[k * 4 + 2] = bch;
      image.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [grid]);

  const toPx = (w: number, b: number) => ({
    x: ((w - W_MIN) / (W_MAX - W_MIN)) * 100,
    y: ((B_MAX - b) / (B_MAX - B_MIN)) * 100,
  });

  const trail = run.path.slice(0, cursor + 1);
  const polyline = trail
    .map((row) => {
      const p = toPx(row.w, row.b);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const statusLabel =
    status === "monotonic"
      ? g.monotonic
      : status === "oscillating"
        ? g.oscillating
        : g.diverging;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {g.title}
      </h3>
      <p className="text-sm text-muted">{g.aha}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Slider
          label={`${g.alpha} (${alpha.toFixed(3)})`}
          min={0.001}
          max={2}
          step={0.001}
          value={alpha}
          onChange={setAlpha}
        />
        <Slider
          label={`${g.scale} (${scale.toFixed(2)})`}
          min={0.2}
          max={10}
          step={0.05}
          value={scale}
          onChange={setScale}
        />
        <Slider label={`${g.w0} (${w0.toFixed(2)})`} min={-2} max={2} step={0.05} value={w0} onChange={setW0} />
        <Slider label={`${g.b0} (${b0.toFixed(2)})`} min={-2} max={2} step={0.05} value={b0} onChange={setB0} />
        <Slider
          label={`${g.iterations} (${iterations})`}
          min={1}
          max={400}
          step={1}
          value={iterations}
          onChange={(value) => setIterations(Math.round(value))}
        />
        <Slider
          label={`${g.noise} (${noise.toFixed(2)})`}
          min={0}
          max={0.4}
          step={0.05}
          value={noise}
          onChange={setNoise}
        />
      </div>
      <label className="block text-xs text-muted">
        {g.seed}
        <input
          type="number"
          className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
          value={seed}
          onChange={(event) => setSeed(Number(event.target.value) || 0)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-accent px-3 py-1.5 text-sm text-white" onClick={() => setPlay((current) => ({ ...current, playing: !current.playing }))}>
          {playing ? g.pause : g.play}
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
          onClick={() =>
            setPlay((current) => ({
              ...current,
              playing: false,
              cursor: Math.min(run.path.length - 1, current.cursor + 1),
            }))
          }
        >
          {g.step}
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
          onClick={() => setPlay((current) => ({ ...current, playing: false, cursor: 0 }))}
        >
          {g.reset}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="α_crit" value={alphaCrit.toFixed(4)} />
        <Stat label="α_osc" value={alphaOsc.toFixed(4)} />
        <Stat label="κ" value={(eigs.lambdaMax / Math.max(eigs.lambdaMin, 1e-12)).toFixed(2)} />
        <Stat label={g.status} value={statusLabel} />
        <Stat label="H₂₂" value={hess.d.toFixed(4)} />
        <Stat label="OLS w, b" value={`${ols.w.toFixed(3)}, ${ols.b.toFixed(3)}`} />
        <Stat label="L_t" value={point ? point.loss.toExponential(3) : "—"} />
        <Stat
          label="‖∇L‖"
          value={point ? point.gradNorm.toExponential(3) : "—"}
        />
      </dl>

      <div className="relative aspect-square max-w-md overflow-hidden rounded-md border border-border">
        <canvas
          ref={canvasRef}
          width={GRID}
          height={GRID}
          className="h-full w-full"
        />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <polyline fill="none" stroke="#111" strokeWidth="0.6" points={polyline} />
          {(() => {
            const star = toPx(ols.w, ols.b);
            return (
              <g>
                <line x1={star.x - 2} y1={star.y} x2={star.x + 2} y2={star.y} stroke="#fff" strokeWidth="0.8" />
                <line x1={star.x} y1={star.y - 2} x2={star.x} y2={star.y + 2} stroke="#fff" strokeWidth="0.8" />
              </g>
            );
          })()}
          {point && (
            <circle
              cx={toPx(point.w, point.b).x}
              cy={toPx(point.w, point.b).y}
              r="1.4"
              fill="#fbbf24"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function Slider(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {props.label}
      <input
        type="range"
        className="mt-1 w-full accent-accent"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
