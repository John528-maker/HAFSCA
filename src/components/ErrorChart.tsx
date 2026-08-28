"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { ModelResult } from "@/types/experiment";
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

interface Props {
  results: ModelResult[];
  interpolationThreshold: number | null;
  selectedDegree: number | null;
  onSelectDegree: (degree: number) => void;
}

export default function ErrorChart({
  results,
  interpolationThreshold,
  selectedDegree,
  onSelectDegree,
}: Props) {
  const { t } = useLanguage();
  const c = t.errorChart;
  const [logScale, setLogScale] = useState(true);

  const data = useMemo(
    () =>
      results.map((r) => ({
        degree: r.degree,
        trainMSE: clampForLog(r.trainMSE, logScale),
        testMSE: clampForLog(r.testMSE, logScale),
        trainRaw: r.trainMSE,
        testRaw: r.testMSE,
      })),
    [results, logScale],
  );

  if (results.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted">
        {c.empty}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {c.title}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {c.hint}{" "}
            {selectedDegree !== null && c.selected(selectedDegree)}
          </p>
        </div>
        <div className="flex rounded-md border border-border text-xs">
          <button
            type="button"
            className={`px-3 py-1.5 ${logScale ? "bg-accent text-white" : "bg-card text-muted"}`}
            onClick={() => setLogScale(true)}
          >
            {c.log}
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 ${!logScale ? "bg-accent text-white" : "bg-card text-muted"}`}
            onClick={() => setLogScale(false)}
          >
            {c.linear}
          </button>
        </div>
      </div>

      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 8, left: 8 }}
            onClick={(state) => {
              const deg = (
                state as { activePayload?: Array<{ payload?: { degree?: number } }> }
              )?.activePayload?.[0]?.payload?.degree;
              if (typeof deg === "number") onSelectDegree(deg);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e2" />
            <XAxis
              dataKey="degree"
              tick={{ fontSize: 11 }}
              label={{
                value: c.xAxis,
                position: "insideBottom",
                offset: -2,
                fontSize: 11,
              }}
            />
            <YAxis
              scale={logScale ? "log" : "auto"}
              domain={logScale ? ["auto", "auto"] : [0, "auto"]}
              tick={{ fontSize: 11 }}
              width={56}
              tickFormatter={(v: number) =>
                v >= 0.01 || v === 0 ? v.toPrecision(2) : v.toExponential(0)
              }
              label={{
                value: logScale ? c.yAxisLog : c.yAxis,
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
              }}
            />
            <Tooltip
              formatter={(value, name, item) => {
                const payload = item?.payload as
                  | { trainRaw?: number; testRaw?: number }
                  | undefined;
                const raw =
                  name === c.trainError
                    ? payload?.trainRaw
                    : payload?.testRaw;
                return [
                  typeof raw === "number" ? raw.toExponential(3) : String(value),
                  String(name),
                ];
              }}
              labelFormatter={(label) => c.degree(String(label))}
            />
            <Legend />
            {interpolationThreshold !== null && (
              <ReferenceLine
                x={interpolationThreshold}
                stroke="#b45309"
                strokeDasharray="4 4"
                label={{
                  value: c.interpolationThreshold,
                  position: "insideTopRight",
                  fill: "#b45309",
                  fontSize: 11,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="trainMSE"
              name={c.trainError}
              stroke="#2563eb"
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="testMSE"
              name={c.testError}
              stroke="#dc2626"
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function clampForLog(v: number, logScale: boolean): number {
  if (!logScale) return v;
  return Math.max(v, 1e-12);
}
