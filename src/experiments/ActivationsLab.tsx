"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  ACTIVATION_NAMES,
  SIGMOID_SATURATION_Z,
  activationPhi,
  activationPhiPrime,
  reluDeadFraction,
  runActivationChain,
  sampleActivationCurve,
  type ActivationName,
} from "@/lib/activations";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function clampLog(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1e-12;
  return Math.max(1e-12, v);
}

export default function ActivationsLab() {
  const { t } = useLanguage();
  const a = t.act;
  const [name, setName] = useState<ActivationName>("sigmoid");
  const [alpha, setAlpha] = useState(0.01);
  const [z0, setZ0] = useState(0);
  const [depth, setDepth] = useState(8);
  const [w, setW] = useState(1);
  const [b, setB] = useState(0);
  const [a0, setA0] = useState(0);
  const [deadW, setDeadW] = useState(1);
  const [deadB, setDeadB] = useState(-1.2);
  const [deadLeaky, setDeadLeaky] = useState(false);

  const leakyOrElu = name === "leaky-relu" || name === "elu";
  const usedAlpha = name === "elu" ? 1 : alpha;
  const curve = useMemo(
    () => sampleActivationCurve(name, -6, 6, 401, usedAlpha),
    [name, usedAlpha],
  );
  const phi0 = activationPhi(name, z0, usedAlpha);
  const dphi0 = activationPhiPrime(name, z0, usedAlpha);
  const saturated = Math.abs(dphi0) < 0.01;
  const chain = useMemo(
    () => runActivationChain(name, depth, w, b, a0, usedAlpha),
    [name, depth, w, b, a0, usedAlpha],
  );
  const last = chain.steps.at(-1);
  const deltaData = chain.steps.map((step) => ({
    layer: step.layer,
    absDelta: clampLog(Math.abs(step.delta)),
    a: step.a,
  }));
  const dead = reluDeadFraction(deadW, deadB);
  const shownDead = deadLeaky ? 0 : dead.fraction;
  const allDead = !deadLeaky && shownDead === 1;

  return (
    <div className="card-3d space-y-5 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {a.title}
      </h3>
      <p className="text-sm text-muted">{a.guide}</p>

      <label className="block text-xs text-muted">
        {a.activation}
        <select
          className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value as ActivationName)}
        >
          {ACTIVATION_NAMES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      {leakyOrElu && name === "leaky-relu" && (
        <label className="block text-xs text-muted">
          α ({alpha.toFixed(2)})
          <input
            type="range"
            className="mt-1 w-full max-w-xs accent-accent"
            min={0.01}
            max={0.5}
            step={0.01}
            value={alpha}
            onChange={(event) => setAlpha(Number(event.target.value))}
          />
        </label>
      )}

      <p className="text-sm">
        z₀={z0.toFixed(2)}, φ={phi0.toFixed(4)}, φ′={dphi0.toFixed(4)}
        {saturated ? ` — ${a.saturated}` : ""}
      </p>
      {name === "sigmoid" && (
        <p className="text-xs text-muted">
          {a.sigmoidNote} (±{SIGMOID_SATURATION_Z.toFixed(3)})
        </p>
      )}
      <label className="block text-xs text-muted">
        z₀ ({z0.toFixed(2)})
        <input
          type="range"
          className="mt-1 w-full max-w-xs accent-accent"
          min={-6}
          max={6}
          step={0.05}
          value={z0}
          onChange={(event) => setZ0(Number(event.target.value))}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <MiniChart data={curve} yKey="phi" title="φ(z)" />
        <MiniChart data={curve} yKey="dphi" title="φ′(z)" />
      </div>

      <h4 className="text-sm font-semibold">{a.chain}</h4>
      <p className="text-xs text-muted">{a.chainNote}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumSlider
          label={`L (${depth})`}
          min={1}
          max={32}
          step={1}
          value={depth}
          onChange={(v) => setDepth(Math.round(v))}
        />
        <NumSlider
          label={`w (${w.toFixed(2)})`}
          min={-2}
          max={2}
          step={0.05}
          value={w}
          onChange={setW}
        />
        <NumSlider
          label={`b (${b.toFixed(2)})`}
          min={-2}
          max={2}
          step={0.05}
          value={b}
          onChange={setB}
        />
        <NumSlider
          label={`a₀ (${a0.toFixed(2)})`}
          min={-3}
          max={3}
          step={0.05}
          value={a0}
          onChange={setA0}
        />
      </div>
      <p className="text-sm">
        a_L={last && !chain.exploded ? last.a.toExponential(3) : "—"}, |δ_L|=
        {chain.exploded
          ? a.exploded
          : last
            ? Math.abs(last.delta).toExponential(3)
            : "—"}
      </p>
      <p className="text-xs text-muted">{a.bound}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 w-full">
          <p className="text-xs text-muted">|δ_ℓ| (log)</p>
          <ResponsiveContainer>
            <LineChart
              data={deltaData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
              <XAxis dataKey="layer" tick={{ fontSize: 11 }} />
              <YAxis
                scale="log"
                domain={[1e-12, "auto"]}
                tick={{ fontSize: 11 }}
                width={48}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="absDelta"
                stroke="#dc2626"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-40 w-full">
          <p className="text-xs text-muted">a_ℓ</p>
          <ResponsiveContainer>
            <LineChart
              data={deltaData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
              <XAxis dataKey="layer" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="a"
                stroke="#1d4ed8"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h4 className="text-sm font-semibold">{a.dead}</h4>
      <p className="text-xs text-muted">{a.deadNote}</p>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={deadLeaky}
          onChange={(event) => setDeadLeaky(event.target.checked)}
        />
        {a.useLeaky}
      </label>
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <NumSlider
          label={`w (${deadW.toFixed(2)})`}
          min={-2}
          max={2}
          step={0.05}
          value={deadW}
          onChange={setDeadW}
        />
        <NumSlider
          label={`b (${deadB.toFixed(2)})`}
          min={-2}
          max={2}
          step={0.05}
          value={deadB}
          onChange={setDeadB}
        />
      </div>
      <p className="text-sm">
        {a.deadFrac}: {(shownDead * 100).toFixed(0)}%
        {allDead ? ` — ${a.allDead}` : ""}
      </p>
      <div className="flex flex-wrap gap-1">
        {dead.xs.map((x, i) => {
          const z = dead.zs[i]!;
          const inactive = deadLeaky ? false : z <= 0;
          return (
            <span
              key={x}
              className={`inline-block h-3 w-3 rounded-sm ${inactive ? "bg-muted" : "bg-train"}`}
              title={`x=${x.toFixed(2)}, z=${z.toFixed(2)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function NumSlider(props: {
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

function MiniChart({
  data,
  yKey,
  title,
}: {
  data: Array<{ z: number; phi: number; dphi: number }>;
  yKey: "phi" | "dphi";
  title: string;
}) {
  return (
    <div className="h-40 w-full">
      <p className="text-xs text-muted">{title}</p>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
          <XAxis dataKey="z" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#1d4ed8"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
