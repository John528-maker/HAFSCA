"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatVerdict } from "@/lib/i18n";
import type { ExperimentSummaryData } from "@/types/experiment";

interface Props {
  summary: ExperimentSummaryData | null;
}

export default function ExperimentSummary({ summary }: Props) {
  const { locale, t } = useLanguage();
  const s = t.summary;

  if (!summary) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted">
        {s.empty}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {s.title}
      </h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Item label={s.datasetSize} value={String(summary.datasetSize)} />
        <Item label={s.noiseLevel} value={summary.noiseLevel.toFixed(2)} />
        <Item label={s.randomSeed} value={String(summary.randomSeed)} />
        <Item
          label={s.bestTest}
          value={s.bestDegree(summary.bestComplexity)}
        />
        <Item
          label={s.interpolationThreshold}
          value={
            summary.interpolationThreshold !== null
              ? s.degree(summary.interpolationThreshold)
              : s.notReached
          }
        />
        <Item
          label={s.minTrain}
          value={summary.minTrainError.toExponential(3)}
        />
        <Item
          label={s.minTest}
          value={summary.minTestError.toExponential(3)}
        />
        <Item
          label={s.doubleDescent}
          value={formatVerdict(locale, summary.doubleDescentStatus)}
        />
      </dl>
      {summary.thresholdBeyondSweep && (
        <p className="mt-3 text-xs text-threshold">{s.beyondSweep}</p>
      )}
      {summary.doubleDescentStatus === "Sweep Range Exhausted" && (
        <p className="mt-3 text-xs text-threshold">{s.sweepRangeExhausted}</p>
      )}
      {!summary.testEstimateReliable && (
        <p className="mt-3 text-xs text-threshold">
          {s.testEstimateWarning}
        </p>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
