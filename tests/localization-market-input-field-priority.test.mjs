import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeMarketInputFieldPriority localizes known field priorities in Korean", () => {
  assert.equal(typeof localization.localizeMarketInputFieldPriority, "function");
  assert.equal(localization.localizeMarketInputFieldPriority("ko", "Core"), "핵심");
  assert.equal(localization.localizeMarketInputFieldPriority("ko", "Support"), "보조");
});

test("localizeMarketInputFieldPriority keeps English priorities unchanged", () => {
  assert.equal(localization.localizeMarketInputFieldPriority("en", "Core"), "Core");
  assert.equal(localization.localizeMarketInputFieldPriority("en", "Support"), "Support");
});

test("localizeMarketInputFieldPriority falls back to the raw priority when it is unknown", () => {
  assert.equal(localization.localizeMarketInputFieldPriority("ko", "Optional"), "Optional");
});
