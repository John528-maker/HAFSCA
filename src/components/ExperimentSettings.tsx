"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { ExperimentConfig } from "@/types/experiment";
import {
  EXPERIMENT_CONFIG,
  sliderMaxComplexity,
} from "@/lib/experiment";

interface Props {
  config: ExperimentConfig;
  onChange: (next: ExperimentConfig) => void;
  onRun: () => void;
  running: boolean;
  progress: { completed: number; total: number } | null;
}

export default function ExperimentSettings({
  config,
  onChange,
  onRun,
  running,
  progress,
}: Props) {
  const { t } = useLanguage();
  const e = t.experiment;
  const nTrain = Math.floor(config.datasetSize * config.trainRatio);
  const maxSlider = sliderMaxComplexity(nTrain);
  const thresholdDeg = nTrain - 1;
  const beyondCap = thresholdDeg > EXPERIMENT_CONFIG.MAX_COMPLEXITY_HARD_CAP;

  function patch(partial: Partial<ExperimentConfig>) {
    const next = { ...config, ...partial };
    if (partial.datasetSize !== undefined) {
      const nt = Math.floor(partial.datasetSize * next.trainRatio);
      next.maxComplexity = Math.min(
        2 * nt,
        EXPERIMENT_CONFIG.MAX_COMPLEXITY_HARD_CAP,
      );
    }
    onChange(next);
  }

  return (
    <aside className="rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {e.settings}
      </h2>

      <div className="mt-5 space-y-5">
        <Field label={e.datasetSize} htmlFor="dataset-size">
          <select
            id="dataset-size"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={config.datasetSize}
            disabled={running}
            onChange={(ev) => patch({ datasetSize: Number(ev.target.value) })}
          >
            {EXPERIMENT_CONFIG.DATASET_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`${e.noiseLevel} (${config.noiseLevel.toFixed(2)})`}
          htmlFor="noise"
        >
          <input
            id="noise"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.noiseLevel}
            disabled={running}
            onChange={(ev) => patch({ noiseLevel: Number(ev.target.value) })}
            className="w-full accent-accent"
          />
        </Field>

        <Field
          label={`${e.maxComplexity} (${config.maxComplexity})`}
          htmlFor="complexity"
        >
          <input
            id="complexity"
            type="range"
            min={1}
            max={maxSlider}
            step={1}
            value={Math.min(config.maxComplexity, maxSlider)}
            disabled={running}
            onChange={(ev) => patch({ maxComplexity: Number(ev.target.value) })}
            className="w-full accent-accent"
          />
          <p className="mt-1 text-xs text-muted">
            {e.interpolationHint(thresholdDeg, nTrain)}
            {beyondCap && e.beyondCap}
          </p>
        </Field>

        <Field label={e.trainTestSplit} htmlFor="split">
          <input
            id="split"
            type="text"
            readOnly
            value={`${Math.round(config.trainRatio * 100)} / ${Math.round((1 - config.trainRatio) * 100)}`}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
            aria-describedby="split-help"
          />
          <p id="split-help" className="mt-1 text-xs text-muted">
            {e.splitHelp}
          </p>
        </Field>

        <Field label={e.randomSeed} htmlFor="seed">
          <input
            id="seed"
            type="number"
            value={config.randomSeed}
            disabled={running}
            onChange={(ev) => patch({ randomSeed: Number(ev.target.value) || 0 })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? e.running : e.run}
      </button>

      {running && progress && (
        <div className="mt-3" aria-live="polite">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>
              {e.degreeProgress} {progress.completed}/{progress.total}
            </span>
            <span>
              {progress.total
                ? Math.round((100 * progress.completed) / progress.total)
                : 0}
              %
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-all"
              style={{
                width: `${progress.total ? (100 * progress.completed) / progress.total : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
