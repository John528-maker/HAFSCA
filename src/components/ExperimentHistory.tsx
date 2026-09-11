"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatVerdict } from "@/lib/i18n";
import type { HistoryEntry } from "@/types/experiment";

interface Props {
  entries: HistoryEntry[];
  onReload: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export default function ExperimentHistory({ entries, onReload, onClear }: Props) {
  const { locale, t } = useLanguage();
  const h = t.history;

  return (
    <div className="card-3d p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-muted">
          {h.title}
        </h3>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {h.clear}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{h.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {entries.map((e, idx) => (
            <li
              key={e.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {h.experiment(entries.length - idx)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  N={e.config.datasetSize} · noise={e.config.noiseLevel.toFixed(2)} ·
                  seed={e.config.randomSeed} · best deg={e.bestComplexity} · min
                  test={e.minTestError.toExponential(2)} · threshold=
                  {e.interpolationThreshold ?? "—"} ·{" "}
                  {formatVerdict(locale, e.doubleDescentStatus)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReload(e)}
                className="press press-secondary press-sm"
              >
                {h.loadSettings}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
