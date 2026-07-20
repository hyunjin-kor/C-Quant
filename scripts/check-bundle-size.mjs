#!/usr/bin/env node
// Fail CI when the renderer bundle exceeds the budget.
//
// The numbers below are gates, not targets. They can move with deliberate
// reasoning, but a passive regression should be caught here first.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ASSETS_DIR = "dist/assets";

// Budgets last bumped 2026-05-07: main JS 350 -> 420 KB to admit
// the v1.3 driver-matrix / catalyst-scenarios / event-log expansion.
// Vendor and CSS unchanged. Future ratchets should be deliberate
// and noted here.
const BUDGETS = [
  { match: /^index-.*\.js$/, label: "main JS chunk", maxBytes: 420 * 1024 },
  { match: /^vendor-react-.*\.js$/, label: "vendor-react chunk", maxBytes: 250 * 1024 },
  { match: /^vendor-charts-.*\.js$/, label: "vendor-charts chunk", maxBytes: 250 * 1024 },
  { match: /^index-.*\.css$/, label: "main CSS chunk", maxBytes: 80 * 1024 }
];

let entries;
try {
  entries = readdirSync(ASSETS_DIR);
} catch (error) {
  console.error(`Could not read ${ASSETS_DIR}. Did vite build run?`);
  console.error(error.message);
  process.exit(1);
}

let failed = false;

for (const budget of BUDGETS) {
  const matched = entries.find((name) => budget.match.test(name));
  if (!matched) {
    console.warn(`[bundle-budget] Skipping ${budget.label} — no file matched ${budget.match}`);
    continue;
  }

  const fullPath = join(ASSETS_DIR, matched);
  const { size } = statSync(fullPath);
  const sizeKb = (size / 1024).toFixed(1);
  const maxKb = (budget.maxBytes / 1024).toFixed(0);

  if (size > budget.maxBytes) {
    console.error(
      `[bundle-budget] FAIL ${budget.label}: ${matched} is ${sizeKb} KB (limit ${maxKb} KB)`
    );
    failed = true;
  } else {
    console.log(
      `[bundle-budget] OK   ${budget.label}: ${matched} = ${sizeKb} KB (limit ${maxKb} KB)`
    );
  }
}

if (failed) {
  console.error(
    "\nBundle exceeded budget. Either trim the change or raise the limit deliberately."
  );
  process.exit(1);
}
