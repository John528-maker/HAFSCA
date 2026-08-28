export type DoubleDescentVerdict =
  | "Clear Double Descent"
  | "Possible Double Descent"
  | "No Clear Double Descent";

export interface ExperimentConfig {
  datasetSize: number;
  noiseLevel: number;
  maxComplexity: number;
  trainRatio: number;
  randomSeed: number;
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface DatasetSplit {
  train: DataPoint[];
  test: DataPoint[];
  all: DataPoint[];
}

export interface ModelResult {
  degree: number;
  paramCount: number;
  trainMSE: number;
  testMSE: number;
  generalizationGap: number;
  coefficients: number[];
}

export interface ExperimentSummaryData {
  datasetSize: number;
  noiseLevel: number;
  randomSeed: number;
  bestComplexity: number;
  minTrainError: number;
  minTestError: number;
  interpolationThreshold: number | null;
  doubleDescentStatus: DoubleDescentVerdict;
  thresholdBeyondSweep: boolean;
}

export interface ExperimentResult {
  id: string;
  createdAt: number;
  config: ExperimentConfig;
  dataset: DatasetSplit;
  results: ModelResult[];
  summary: ExperimentSummaryData;
  analysisNotes: string[];
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  config: ExperimentConfig;
  bestComplexity: number;
  minTestError: number;
  interpolationThreshold: number | null;
  doubleDescentStatus: DoubleDescentVerdict;
  /** Stored so a future Compare Experiments view needs no schema change. */
  testErrorCurve: Array<{ degree: number; testMSE: number }>;
}
