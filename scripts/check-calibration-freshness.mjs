#!/usr/bin/env node
/**
 * Calibration freshness check.
 *
 * Reads the REVIEWED_AT constant from src/data/catalystCalibration.ts
 * and the calibratedAt const from src/data/catalystScenarios.ts, plus
 * the number of catalyst events in src/data/catalystEventLog.ts.
 * Prints a freshness summary and exits non-zero when any timestamp is
 * older than the configured threshold.
 *
 * The script is regex-based on purpose so it has no compile step and
 * stays auditable. The downstream Vitest suite already validates that
 * the calibration table is well-formed at build time.
 *
 * Usage:
 *   node scripts/check-calibration-freshness.mjs
 *   node scripts/check-calibration-freshness.mjs --max-age-days 60
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
let maxAgeDays = 90;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--max-age-days" && i + 1 < args.length) {
    const parsed = Number(args[i + 1]);
    if (Number.isFinite(parsed) && parsed > 0) maxAgeDays = parsed;
    i++;
  }
}

async function readDate(filePath, regex, label) {
  const text = await readFile(filePath, "utf-8");
  const match = text.match(regex);
  if (!match) {
    console.error(`Could not find ${label} in ${filePath}`);
    process.exit(2);
  }
  return match[1];
}

async function readCount(filePath, regex) {
  const text = await readFile(filePath, "utf-8");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

const calibratedAt = await readDate(
  resolve(PROJECT_ROOT, "src/data/catalystScenarios.ts"),
  /const\s+calibratedAt\s*=\s*"(\d{4}-\d{2}-\d{2})"/,
  "calibratedAt"
);
const reviewedAtCalibration = await readDate(
  resolve(PROJECT_ROOT, "src/data/catalystCalibration.ts"),
  /const\s+REVIEWED_AT\s*=\s*"(\d{4}-\d{2}-\d{2})"/,
  "REVIEWED_AT (catalystCalibration.ts)"
);
const eventCount = await readCount(
  resolve(PROJECT_ROOT, "src/data/catalystEventLog.ts"),
  /scenarioId:\s*"/g
);

function ageDays(iso) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return Infinity;
  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

const rows = [
  { label: "Catalyst scenarios calibratedAt", date: calibratedAt },
  { label: "Calibration REVIEWED_AT", date: reviewedAtCalibration }
];

console.log(`\nCalibration freshness check (max age = ${maxAgeDays} days)\n` + "-".repeat(70));
let stale = 0;
for (const row of rows) {
  const age = ageDays(row.date);
  const isStale = age > maxAgeDays;
  if (isStale) stale += 1;
  console.log(
    `${row.label.padEnd(46)}  ${row.date}  age=${String(age).padStart(4)}d${
      isStale ? "  STALE" : ""
    }`
  );
}
console.log("-".repeat(70));
console.log(`Catalyst events in log: ${eventCount}`);

if (stale > 0) {
  console.error(`\n${stale} calibration timestamp(s) older than ${maxAgeDays} days.`);
  console.error(
    "Action: re-run the event study, bump the reviewedAt fields, log the change in CHANGELOG.md per docs/MODEL_CARD.md §9."
  );
  process.exit(1);
}
console.log("\nAll calibration timestamps are within the freshness threshold.");
process.exit(0);
