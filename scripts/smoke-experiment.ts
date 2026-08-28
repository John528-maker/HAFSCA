/**
 * Quick smoke run of the full experiment engine (defaults).
 * node --experimental-strip-types scripts/smoke-experiment.ts
 */
import { runExperiment, defaultConfig } from "../src/lib/experiment.ts";

const config = defaultConfig();
console.log("Config:", config);

const t0 = Date.now();
const result = await runExperiment(config, (p) => {
  if (p.completed % 20 === 0 || p.completed === p.total) {
    process.stdout.write(`\r  ${p.completed}/${p.total} deg=${p.currentDegree}   `);
  }
});
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("Summary:", result.summary);
console.log("Notes:", result.analysisNotes.length);
console.log(
  "Train MSE at first/mid/last:",
  result.results[0]!.trainMSE,
  result.results[Math.floor(result.results.length / 2)]!.trainMSE,
  result.results.at(-1)!.trainMSE,
);
console.log(
  "Test MSE at first/mid/last:",
  result.results[0]!.testMSE,
  result.results[Math.floor(result.results.length / 2)]!.testMSE,
  result.results.at(-1)!.testMSE,
);

if (result.summary.interpolationThreshold === null) {
  console.warn("WARN: no interpolation threshold found");
  process.exit(1);
}
console.log("OK");
