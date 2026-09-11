"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  CHEBYSHEV_KAPPA,
  CHEBYSHEV_UNIFORM_KAPPA_AT_40,
  MONOMIAL_KAPPA,
  RIDGE_KAPPA_CEILING,
  formatKappa,
} from "@/lib/conditioning";
import { RIDGE } from "@/lib/linalg";
import { chartTheme } from "@/lib/chartTheme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ConditioningLab() {
  const { t } = useLanguage();
  const c = t.cond;
  const mono = MONOMIAL_KAPPA.map((row) => ({
    degree: row.degree,
    monomial: row.kappa,
  }));
  const cheb = CHEBYSHEV_KAPPA.map((row) => ({
    degree: row.degree,
    chebyshev: row.kappa,
  }));
  const gramBoundExample = 40 / RIDGE + 1;

  return (
    <div className="card-3d space-y-4 p-5">
      <h3 className="text-sm font-extrabold text-muted">{c.title}</h3>
      <p className="text-sm text-muted">{c.guide}</p>
      <p className="text-sm text-threshold">{c.twoKappas}</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <caption className="mb-2 text-left text-xs text-muted">
            {c.tableCaption}
          </caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 pr-3 font-medium">{c.degree}</th>
              <th className="py-2 pr-3 font-medium">{c.monomial}</th>
              <th className="py-2 font-medium">{c.chebyshev}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {MONOMIAL_KAPPA.map((row) => {
              const chebRow = CHEBYSHEV_KAPPA.find((r) => r.degree === row.degree);
              return (
                <tr key={row.degree} className="border-b border-border/60">
                  <td className="py-1.5 pr-3">{row.degree}</td>
                  <td className="py-1.5 pr-3">{formatKappa(row.kappa)}</td>
                  <td className="py-1.5">
                    {chebRow ? formatKappa(chebRow.kappa) : "—"}
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-border/60">
              <td className="py-1.5 pr-3">40</td>
              <td className="py-1.5 pr-3">—</td>
              <td className="py-1.5">
                {formatKappa(16)}{" "}
                <span className="text-muted">
                  ({c.vsUniform} {formatKappa(CHEBYSHEV_UNIFORM_KAPPA_AT_40)})
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-border p-3">
          <dt className="text-muted">{c.measured}</dt>
          <dd className="mt-1 font-medium">{c.measuredDef}</dd>
        </div>
        <div className="rounded-md border border-border p-3">
          <dt className="text-muted">{c.guard}</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {c.guardDef(formatKappa(gramBoundExample), formatKappa(RIDGE_KAPPA_CEILING))}
          </dd>
        </div>
      </dl>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56">
          <p className="mb-1 text-xs text-muted">{c.monoChart}</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mono}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
              <XAxis dataKey="degree" tick={{ fontSize: 11 }} />
              <YAxis
                scale="log"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                width={48}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatKappa(value) : String(value)
                }
              />
              <Legend />
              <Bar
                dataKey="monomial"
                name={c.monomial}
                fill={chartTheme.testHex}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56">
          <p className="mb-1 text-xs text-muted">{c.chebChart}</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cheb}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.borderHex} />
              <XAxis dataKey="degree" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatKappa(value) : String(value)
                }
              />
              <Legend />
              <Bar
                dataKey="chebyshev"
                name={c.chebyshev}
                fill={chartTheme.trainHex}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
