export const EXPERIMENT_IDS = [
  "linear-regression",
  "gradient-descent",
  "overfitting",
  "double-descent",
] as const;

export type ExperimentId = (typeof EXPERIMENT_IDS)[number];

export function isExperimentId(value: string): value is ExperimentId {
  return (EXPERIMENT_IDS as readonly string[]).includes(value);
}
