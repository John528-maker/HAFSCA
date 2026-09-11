/** Chart colors from CSS tokens — keep in sync with globals.css :root. */
export const chartTheme = {
  train: "var(--train)",
  test: "var(--test)",
  threshold: "var(--threshold)",
  border: "var(--border)",
  foreground: "var(--foreground)",
  muted: "var(--muted)",
  /** Recharts often needs concrete paints; these match the token hexes. */
  trainHex: "#2563eb",
  testHex: "#dc2626",
  thresholdHex: "#b45309",
  borderHex: "#e5e5e5",
  foregroundHex: "#3c3c3c",
  noisyTestHex: "#c2410c",
  truthHex: "#059669",
  validHex: "#7c3aed",
} as const;
