"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { DatasetSplit } from "@/types/experiment";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  dataset: DatasetSplit | null;
}

export default function DatasetChart({ dataset }: Props) {
  const { t } = useLanguage();
  const d = t.dataset;

  if (!dataset) {
    return (
      <EmptyChart message={d.empty} />
    );
  }

  return (
    <div className="card-3d p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {d.title}
      </h3>
      <p className="mt-1 text-xs text-muted">
        {d.caption(dataset.train.length, dataset.test.length)}
      </p>
      <div className="mt-4 h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
            <XAxis
              type="number"
              dataKey="x"
              name={d.input}
              domain={[-1.05, 1.05]}
              tick={{ fontSize: 11 }}
              label={{ value: d.input, position: "insideBottom", offset: -2, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={d.target}
              tick={{ fontSize: 11 }}
              label={{ value: d.target, angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(3) : String(value)
              }
            />
            <Legend />
            <Scatter
              name={d.training}
              data={dataset.train}
              fill="#2563eb"
              fillOpacity={0.75}
            />
            <Scatter
              name={d.test}
              data={dataset.test}
              fill="#dc2626"
              fillOpacity={0.75}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted sm:h-72">
      {message}
    </div>
  );
}
