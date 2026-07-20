#!/usr/bin/env node
// Encoding hygiene gate.
//
// Walks the renderer source tree and reports any file that:
//   1. Starts with a UTF-8 BOM (EF BB BF). TypeScript and Vite tolerate
//      it but it round-trips poorly through CP949<->UTF-8 editors and
//      was the entry point for a 160-string mojibake incident on
//      src/App.tsx.
//   2. Contains mojibake-shaped Korean — Hangul mixed with CJK
//      ideographs (the codebase's Korean copy never uses Hanja), or
//      Hangul interleaved with literal '?' or '占' replacement glyphs.
//
// Run: npm run encoding:check  (manual gate; src/App.tsx still carries
// known mojibake in dead `t()` ko args that don't reach users — clean
// those before wiring this into `npm run build`).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const ROOTS = ["src"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
// Mojibake signals must require *adjacency* with Hangul. Loose tests
// (Hangul anywhere + Han anywhere) false-positive on regex literals
// that intentionally enumerate the mojibake characters and on Korean
// questions that legitimately end with '?'.
const MOJIBAKE_HAN = /[가-힣]\p{Script=Han}|\p{Script=Han}[가-힣]/u;
const MOJIBAKE_QMARK = /[가-힣]\?[가-힣]/;
const MOJIBAKE_REPL = /[가-힣]占|占[가-힣]/;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      yield* walk(full);
      continue;
    }
    if (!EXTS.has(extname(entry.name))) continue;
    yield full;
  }
}

const failures = [];

for (const root of ROOTS) {
  let exists = true;
  try {
    statSync(root);
  } catch {
    exists = false;
  }
  if (!exists) continue;

  for (const file of walk(root)) {
    const raw = readFileSync(file);
    if (raw.length >= 3 && raw.subarray(0, 3).equals(BOM)) {
      failures.push({ file, kind: "BOM", line: 1, sample: "<BOM>" });
    }
    const text = raw.toString("utf8");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (MOJIBAKE_HAN.test(line)) {
        failures.push({
          file,
          kind: "Hangul adjacent Han ideograph",
          line: i + 1,
          sample: line.trim().slice(0, 80)
        });
        continue;
      }
      if (MOJIBAKE_QMARK.test(line)) {
        failures.push({
          file,
          kind: "Hangul-?-Hangul",
          line: i + 1,
          sample: line.trim().slice(0, 80)
        });
        continue;
      }
      if (MOJIBAKE_REPL.test(line)) {
        failures.push({
          file,
          kind: "Hangul-占 replacement glyph",
          line: i + 1,
          sample: line.trim().slice(0, 80)
        });
      }
    }
  }
}

if (failures.length === 0) {
  console.log("[encoding] OK   No BOM or mojibake detected in src/.");
  process.exit(0);
}

for (const f of failures) {
  const rel = relative(process.cwd(), f.file).split(sep).join("/");
  console.error(`[encoding] FAIL ${rel}:${f.line}  ${f.kind}  ${f.sample}`);
}
console.error(
  `\n${failures.length} encoding issue${failures.length === 1 ? "" : "s"} found. ` +
    "Re-save offending file(s) as UTF-8 without BOM and re-translate any mojibake."
);
process.exit(1);
