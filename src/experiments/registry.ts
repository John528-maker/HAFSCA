export const EXPERIMENT_IDS = [
  "linear-regression",
  "gradient-descent",
  "activations",
  "overfitting",
  "bias-variance",
  "ridge",
  "double-descent",
  "generalization",
  "conditioning",
  "finite-diff",
] as const;

export type ExperimentId = (typeof EXPERIMENT_IDS)[number];

export function isExperimentId(value: string): value is ExperimentId {
  return (EXPERIMENT_IDS as readonly string[]).includes(value);
}
