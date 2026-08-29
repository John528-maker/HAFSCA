"use client";

import AnalysisPanel from "@/components/AnalysisPanel";
import DatasetChart from "@/components/DatasetChart";
import ErrorChart from "@/components/ErrorChart";
import ExperimentHistory from "@/components/ExperimentHistory";
import ExperimentSettings from "@/components/ExperimentSettings";
import ExperimentSummary from "@/components/ExperimentSummary";
import { useLanguage } from "@/components/LanguageProvider";
import ModelExplorer from "@/components/ModelExplorer";
import { buildAnalysisNotes } from "@/lib/analysis";
import {
  appendHistory,
  clearHistory,
  loadHistory,
} from "@/lib/history";
import { defaultConfig, runExperiment } from "@/lib/experiment";
import type {
  ExperimentConfig,
  ExperimentResult,
  HistoryEntry,
} from "@/types/experiment";
import { useMemo, useState, useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ExperimentWorkspace() {
  const { locale, t } = useLanguage();
  const [config, setConfig] = useState<ExperimentConfig>(defaultConfig);
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  const selected = useMemo(() => {
    if (!result || selectedDegree === null) return null;
    return result.results.find((r) => r.degree === selectedDegree) ?? null;
  }, [result, selectedDegree]);

  const analysisNotes = useMemo(() => {
    if (!result) return [];
    return buildAnalysisNotes(
      result.results,
      result.summary.interpolationThreshold,
      result.summary.doubleDescentStatus,
      locale,
    );
  }, [result, locale]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setProgress({ completed: 0, total: 1 });
    try {
      const next = await runExperiment(config, (p) =>
        setProgress({ completed: p.completed, total: p.total }),
      );
      setResult(next);
      const best = next.results.reduce((a, b) =>
        b.testMSE < a.testMSE ? b : a,
      );
      setSelectedDegree(best.degree);
      setHistory(appendHistory(next));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  function handleReload(entry: HistoryEntry) {
    setConfig({ ...entry.config });
    setError(null);
  }

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <section id="experiments" className="scroll-mt-16">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          {t.experiment.title}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          {t.experiment.description}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <ExperimentSettings
            config={config}
            onChange={setConfig}
            onRun={handleRun}
            running={running}
            progress={progress}
          />

          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <DatasetChart dataset={result?.dataset ?? null} />

            <ExperimentSummary summary={result?.summary ?? null} />

            <ErrorChart
              results={result?.results ?? []}
              interpolationThreshold={
                result?.summary.interpolationThreshold ?? null
              }
              selectedDegree={selectedDegree}
              onSelectDegree={setSelectedDegree}
            />

            <ModelExplorer
              dataset={result?.dataset ?? null}
              selected={selected}
            />

            <AnalysisPanel notes={analysisNotes} />

            <ExperimentHistory
              entries={hydrated ? history : []}
              onReload={handleReload}
              onClear={handleClear}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
