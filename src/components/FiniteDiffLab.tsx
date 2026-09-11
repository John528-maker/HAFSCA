"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useMemo, useState } from "react";

/** Research B toy: n=2, (x,y)=(1,3),(2,5) → J'(θ)=5θ−13. */
function analyticJPrime(theta: number): number {
  return 5 * theta - 13;
}

function lossJ(theta: number): number {
  const r1 = theta * 1 - 3;
  const r2 = theta * 2 - 5;
  return (r1 * r1 + r2 * r2) / 2;
}

function finiteDiff(theta: number, h: number): number {
  return (lossJ(theta + h) - lossJ(theta)) / h;
}

export default function FiniteDiffLab() {
  const { locale } = useLanguage();
  const ko = locale === "ko";
  const [theta, setTheta] = useState(2);
  const [log10H, setLog10H] = useState(-4);
  const h = 10 ** log10H;

  const analytic = useMemo(() => analyticJPrime(theta), [theta]);
  const numeric = useMemo(() => finiteDiff(theta, h), [theta, h]);
  const absErr = Math.abs(numeric - analytic);

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {ko ? "유한차분 vs 해석 도함수" : "Finite difference vs analytic derivative"}
      </h3>
      <p className="text-sm text-muted">
        {ko
          ? "검산 예제: n=2, (x,y)=(1,3)·(2,5). J'(θ)=5θ−13. θ=2에서 J'(2)=−3."
          : "Check: n=2, (x,y)=(1,3)·(2,5). J′(θ)=5θ−13. At θ=2, J′(2)=−3."}
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          θ ({theta.toFixed(2)})
          <input
            type="range"
            className="ml-2 align-middle accent-accent"
            min={0}
            max={4}
            step={0.05}
            value={theta}
            onChange={(event) => setTheta(Number(event.target.value))}
          />
        </label>
        <label className="text-xs text-muted">
          log₁₀ h ({log10H.toFixed(1)})
          <input
            type="range"
            className="ml-2 align-middle accent-accent"
            min={-8}
            max={-1}
            step={0.1}
            value={log10H}
            onChange={(event) => setLog10H(Number(event.target.value))}
          />
        </label>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">{ko ? "해석 J′" : "Analytic J′"}</dt>
          <dd className="tabular-nums font-medium">{analytic.toFixed(6)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{ko ? "유한차분" : "Finite difference"}</dt>
          <dd className="tabular-nums font-medium">{numeric.toFixed(6)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">|Δ|</dt>
          <dd className="tabular-nums font-medium">{absErr.toExponential(2)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">h</dt>
          <dd className="tabular-nums font-medium">{h.toExponential(1)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        {ko
          ? "h가 너무 크면 절단 오차, 너무 작으면 반올림 오차가 커집니다. 중간 값이 해석 기울기에 가깝습니다."
          : "Large h truncates; tiny h rounds. A middle step size hugs the analytic slope."}
      </p>
    </div>
  );
}
