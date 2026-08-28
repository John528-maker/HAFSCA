"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { DatasetSplit, ModelResult } from "@/types/experiment";
import { predict } from "@/lib/regression";
import { useMemo } from "react";
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

interface Props {
  dataset: DatasetSplit | null;
  selected: ModelResult | null;
}

export default function ModelExplorer({ dataset, selected }: Props) {
  const { t } = useLanguage();
  const m = t.modelExplorer;

  const curve = useMemo(() => {
    if (!selected) return [];
    const xs: number[] = [];
    for (let i = 0; i <= 200; i++) xs.push(-1 + (2 * i) / 200);
    const ys = predict(
      {
        degree: selected.degree,
        coefficients: selected.coefficients,
        paramCount: selected.paramCount,
      },
      xs,
    );
    return xs.map((x, i) => ({ x, y: ys[i]! }));
  }, [selected]);

  if (!selected || !dataset) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted">
        {m.empty}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {m.title}
      </h3>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label={m.polynomialDegree} value={String(selected.degree)} />
        <Stat label={m.parameters} value={String(selected.paramCount)} />
        <Stat label={m.trainMSE} value={selected.trainMSE.toExponential(3)} />
        <Stat label={m.testMSE} value={selected.testMSE.toExponential(3)} />
        <Stat
          label={m.generalizationGap}
          value={selected.generalizationGap.toExponential(3)}
        />
      </dl>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[-1.05, 1.05]}
              tick={{ fontSize: 11 }}
              label={{ value: m.input, position: "insideBottom", offset: -2, fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(3) : String(value)
              }
            />
            <Legend />
            <Scatter
              name={m.training}
              data={dataset.train}
              fill="#2563eb"
              fillOpacity={0.55}
            />
            <Scatter
              name={m.test}
              data={dataset.test}
              fill="#dc2626"
              fillOpacity={0.55}
            />
            <Line
              name={m.prediction(selected.degree)}
              data={curve}
              type="monotone"
              dataKey="y"
              stroke="#111827"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm">{value}</dd>
    </div>
  );
}
