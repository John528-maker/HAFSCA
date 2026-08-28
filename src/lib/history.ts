import type { ExperimentResult, HistoryEntry } from "../types/experiment.ts";

const STORAGE_KEY = "ai-research-lab.history.v1";
const MAX_ENTRIES = 30;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function appendHistory(result: ExperimentResult): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: result.id,
    createdAt: result.createdAt,
    config: result.config,
    bestComplexity: result.summary.bestComplexity,
    minTestError: result.summary.minTestError,
    interpolationThreshold: result.summary.interpolationThreshold,
    doubleDescentStatus: result.summary.doubleDescentStatus,
    testErrorCurve: result.results.map((r) => ({
      degree: r.degree,
      testMSE: r.testMSE,
    })),
  };
  const next = [entry, ...loadHistory().filter((e) => e.id !== entry.id)].slice(
    0,
    MAX_ENTRIES,
  );
  saveHistory(next);
  return next;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
