"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  BACKPROP_CHECK_DEFAULTS,
  runBackpropCheck,
} from "@/lib/backpropCheck";
import { useMemo, useState } from "react";

export default function BackpropCheck() {
  const { t } = useLanguage();
  const b = t.bp;
  const [x, setX] = useState<number>(BACKPROP_CHECK_DEFAULTS.x);
  const [w, setW] = useState<number>(BACKPROP_CHECK_DEFAULTS.w);
  const [bias, setBias] = useState<number>(BACKPROP_CHECK_DEFAULTS.b);
  const [y, setY] = useState<number>(BACKPROP_CHECK_DEFAULTS.y);
  const [h, setH] = useState<number>(BACKPROP_CHECK_DEFAULTS.h);
  const result = useMemo(
    () => runBackpropCheck({ x, w, b: bias, y, h }),
    [x, w, bias, y, h],
  );
  const agrees = result.relErrW < 1e-4 && result.relErrB < 1e-4;

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {b.title}
      </h3>
      <p className="text-sm text-muted">{b.guide}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <NumSlider label={`x (${x.toFixed(2)})`} min={-2} max={2} step={0.05} value={x} onChange={setX} />
        <NumSlider label={`w (${w.toFixed(2)})`} min={-2} max={2} step={0.05} value={w} onChange={setW} />
        <NumSlider label={`b (${bias.toFixed(2)})`} min={-2} max={2} step={0.05} value={bias} onChange={setBias} />
        <NumSlider label={`y (${y.toFixed(2)})`} min={0} max={1} step={0.05} value={y} onChange={setY} />
        <label className="text-xs text-muted">
          h
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={h}
            onChange={(event) => setH(Number(event.target.value))}
          >
            <option value={1e-3}>10⁻³</option>
            <option value={1e-4}>10⁻⁴</option>
            <option value={1e-5}>10⁻⁵</option>
            <option value={1e-6}>10⁻⁶</option>
          </select>
        </label>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="ŷ" value={result.yHat.toFixed(4)} />
        <Stat label="J" value={result.loss.toExponential(3)} />
        <Stat label="∂J/∂w" value={result.dLossDw.toExponential(3)} />
        <Stat label="FD ∂J/∂w" value={result.fdW.toExponential(3)} />
        <Stat label="∂J/∂b" value={result.dLossDb.toExponential(3)} />
        <Stat label="FD ∂J/∂b" value={result.fdB.toExponential(3)} />
        <Stat label={b.relW} value={result.relErrW.toExponential(2)} />
        <Stat label={b.relB} value={result.relErrB.toExponential(2)} />
      </dl>
      <p className="text-sm">{agrees ? b.match : b.mismatch}</p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-extrabold text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
