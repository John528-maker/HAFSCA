"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  OLS_DEFAULTS,
  OLS_N_MAX,
  OLS_N_MIN,
  OLS_OUTLIER,
  OLS_X_MAX,
  OLS_X_MIN,
  canAddOutlier,
  clampOlsX,
  clampOlsY,
  fitLiveOls,
  generateOlsPoints,
  nextOlsId,
  olsMetrics,
  olsTruth,
  type OlsPoint,
} from "@/lib/ols";
import { useRef, useState } from "react";

const X0 = -1.05;
const X1 = 1.05;
const Y0 = -2.05;
const Y1 = 2.05;
const VB_W = 640;
const VB_H = 400;

function toSvg(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: ((x - X0) / (X1 - X0)) * VB_W,
    sy: ((Y1 - y) / (Y1 - Y0)) * VB_H,
  };
}

function fromSvg(sx: number, sy: number): { x: number; y: number } {
  return {
    x: clampOlsX(X0 + (sx / VB_W) * (X1 - X0)),
    y: clampOlsY(Y1 - (sy / VB_H) * (Y1 - Y0)),
  };
}

export default function LinearRegressionLab() {
  const { t } = useLanguage();
  const l = t.lr;
  const [noise, setNoise] = useState<number>(OLS_DEFAULTS.noise);
  const [seed, setSeed] = useState<number>(OLS_DEFAULTS.seed);
  const [interceptOn, setInterceptOn] = useState<boolean>(OLS_DEFAULTS.interceptOn);
  const [showTruth, setShowTruth] = useState<boolean>(true);
  const [showResiduals, setShowResiduals] = useState<boolean>(true);
  const [points, setPoints] = useState<OlsPoint[]>(() =>
    generateOlsPoints(OLS_DEFAULTS.n, OLS_DEFAULTS.noise, OLS_DEFAULTS.seed),
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);

  const fit = fitLiveOls(points, interceptOn);
  const okLine =
    fit.status === "ok" && fit.w !== null && fit.b !== null
      ? { w: fit.w, b: fit.b }
      : null;
  const [frozen, setFrozen] = useState<{ w: number; b: number } | null>(okLine);
  if (okLine && (frozen === null || frozen.w !== okLine.w || frozen.b !== okLine.b)) {
    setFrozen(okLine);
  }
  const line = okLine ?? frozen;
  const metrics = line ? olsMetrics(points, line.w, line.b) : null;
  const aha = metrics !== null && metrics.leverageShare > 0.4;

  function regenerate(nextNoise = noise, nextSeed = seed) {
    setPoints(generateOlsPoints(OLS_DEFAULTS.n, nextNoise, nextSeed));
    setSelectedId(null);
    setFrozen(null);
  }

  function clientToSvg(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * VB_W;
    const sy = ((event.clientY - rect.top) / rect.height) * VB_H;
    return { sx, sy, ...fromSvg(sx, sy) };
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const hit = clientToSvg(event);
    if (!hit) return;
    const nearest = points
      .map((point) => {
        const p = toSvg(point.x, point.y);
        return {
          point,
          dist: Math.hypot(p.sx - hit.sx, p.sy - hit.sy),
        };
      })
      .sort((a, b) => a.dist - b.dist)[0];
    if (nearest && nearest.dist < 14) {
      dragRef.current = { id: nearest.point.id, moved: false };
      setSelectedId(nearest.point.id);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    dragRef.current = { id: -1, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id < 0) return;
    const hit = clientToSvg(event);
    if (!hit) return;
    drag.moved = true;
    setPoints((current) =>
      current.map((point) =>
        point.id === drag.id ? { ...point, x: hit.x, y: hit.y } : point,
      ),
    );
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved || drag.id >= 0) return;
    if (points.length >= OLS_N_MAX) return;
    const hit = clientToSvg(event);
    if (!hit) return;
    const id = nextOlsId(points);
    setPoints((current) => [...current, { id, x: hit.x, y: hit.y }]);
    setSelectedId(id);
  }

  function removeSelected() {
    if (selectedId === null || points.length <= OLS_N_MIN) return;
    setPoints((current) => current.filter((point) => point.id !== selectedId));
    setSelectedId(null);
  }

  function addOutlier() {
    if (!canAddOutlier(points)) return;
    const id = nextOlsId(points);
    setPoints((current) => [
      ...current,
      { id, x: OLS_OUTLIER.x, y: OLS_OUTLIER.y },
    ]);
    setSelectedId(id);
  }

  const start = line ? toSvg(OLS_X_MIN, line.w * OLS_X_MIN + line.b) : null;
  const end = line ? toSvg(OLS_X_MAX, line.w * OLS_X_MAX + line.b) : null;
  const truthStart = toSvg(OLS_X_MIN, olsTruth(OLS_X_MIN));
  const truthEnd = toSvg(OLS_X_MAX, olsTruth(OLS_X_MAX));
  const hovered =
    hoverId !== null ? points.find((point) => point.id === hoverId) : null;
  const hoverIndex = hovered
    ? points.findIndex((point) => point.id === hovered.id)
    : -1;
  const statusLabel =
    fit.status === "ok"
      ? l.ok
      : fit.status === "need-spread"
        ? l.needSpread
        : l.needPoints;

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {l.title}
      </h3>
      <p className="text-sm text-muted">{l.guide}</p>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <label>
          {l.noise} ({noise.toFixed(2)})
          <input
            type="range"
            className="ml-2 align-middle accent-accent"
            min={0}
            max={0.8}
            step={0.05}
            value={noise}
            onChange={(event) => {
              const next = Number(event.target.value);
              setNoise(next);
              regenerate(next, seed);
            }}
          />
        </label>
        <label>
          {l.seed}
          <input
            type="number"
            className="ml-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={seed}
            onChange={(event) => {
              const next = Number(event.target.value) || 0;
              setSeed(next);
              regenerate(noise, next);
            }}
          />
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={interceptOn}
            onChange={(event) => setInterceptOn(event.target.checked)}
          />
          {l.intercept}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showTruth}
            onChange={(event) => setShowTruth(event.target.checked)}
          />
          {l.truth}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showResiduals}
            onChange={(event) => setShowResiduals(event.target.checked)}
          />
          {l.residuals}
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="press press-secondary press-sm"
          onClick={() => regenerate()}
        >
          {l.reset}
        </button>
        <button
          type="button"
          className="press press-secondary press-sm"
          onClick={addOutlier}
          disabled={!canAddOutlier(points)}
        >
          {l.outlier}
        </button>
        <button
          type="button"
          className="press press-secondary press-sm"
          onClick={removeSelected}
          disabled={selectedId === null || points.length <= OLS_N_MIN}
        >
          {l.deletePoint}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="w" value={line ? line.w.toFixed(3) : "—"} />
        <Stat label="b" value={line ? line.b.toFixed(3) : "—"} />
        <Stat label="MSE" value={metrics ? metrics.mse.toExponential(3) : "—"} />
        <Stat
          label="R²"
          value={
            metrics?.r2 === null || metrics?.r2 === undefined
              ? "—"
              : metrics.r2.toFixed(3)
          }
        />
        <Stat label="RMSE" value={metrics ? metrics.rmse.toFixed(3) : "—"} />
        <Stat label="MAE" value={metrics ? metrics.mae.toFixed(3) : "—"} />
        <Stat
          label="κ"
          value={
            fit.kappa !== null && Number.isFinite(fit.kappa)
              ? fit.kappa.toFixed(2)
              : "—"
          }
        />
        <Stat label={l.status} value={statusLabel} />
      </dl>
      {aha && <p className="text-sm text-threshold">{l.aha}</p>}
      {fit.status === "need-spread" && (
        <p className="text-sm text-threshold">{l.needSpread}</p>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full max-w-3xl cursor-crosshair touch-none rounded-md border border-border bg-background"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={l.title}
      >
        {showTruth && (
          <line
            x1={truthStart.sx}
            y1={truthStart.sy}
            x2={truthEnd.sx}
            y2={truthEnd.sy}
            stroke="#9ca3af"
            strokeDasharray="6 4"
            strokeWidth="2"
          />
        )}
        {start && end && (
          <line
            x1={start.sx}
            y1={start.sy}
            x2={end.sx}
            y2={end.sy}
            stroke="#111"
            strokeWidth="2"
            opacity={fit.status === "ok" ? 1 : 0.45}
          />
        )}
        {showResiduals &&
          line &&
          points.map((point) => {
            const from = toSvg(point.x, point.y);
            const to = toSvg(point.x, line.w * point.x + line.b);
            return (
              <line
                key={`r-${point.id}`}
                x1={from.sx}
                y1={from.sy}
                x2={to.sx}
                y2={to.sy}
                stroke="#dc2626"
                strokeWidth="1.5"
              />
            );
          })}
        {points.map((point, index) => {
          const p = toSvg(point.x, point.y);
          const selected = point.id === selectedId;
          const maxErr = metrics?.maxAbsIndex === index;
          return (
            <circle
              key={point.id}
              cx={p.sx}
              cy={p.sy}
              r={selected ? 8 : 6}
              fill={maxErr ? "#b45309" : "#2563eb"}
              stroke={selected ? "#111" : "white"}
              strokeWidth="2"
              onPointerEnter={() => setHoverId(point.id)}
              onPointerLeave={() => setHoverId(null)}
            />
          );
        })}
      </svg>
      <p className="text-xs text-muted">{l.hint}</p>
      {hovered && metrics && hoverIndex >= 0 && (
        <p className="text-xs text-muted">
          x={hovered.x.toFixed(3)}, y={hovered.y.toFixed(3)}, ŷ=
          {line ? (line.w * hovered.x + line.b).toFixed(3) : "—"}, r=
          {metrics.residuals[hoverIndex]!.toFixed(3)}, r²/n=
          {metrics.contributions[hoverIndex]!.toExponential(2)}
        </p>
      )}

      {metrics && (
        <div className="flex h-4 overflow-hidden rounded-sm border border-border">
          {metrics.contributions.map((share, index) => (
            <div
              key={points[index]!.id}
              style={{
                width: `${Math.max(0.5, (share / Math.max(metrics.mse, 1e-12)) * 100)}%`,
                background:
                  index === metrics.maxAbsIndex ? "#b45309" : "#2563eb",
                opacity:
                  0.35 +
                  0.65 * (share / Math.max(...metrics.contributions, 1e-12)),
              }}
              title={`r²/n = ${share.toExponential(2)}`}
            />
          ))}
        </div>
      )}
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
