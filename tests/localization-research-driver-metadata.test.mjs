import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeResearchDriverImportance localizes known importance levels in Korean", () => {
  assert.equal(typeof localization.localizeResearchDriverImportance, "function");
  assert.equal(localization.localizeResearchDriverImportance("ko", "Core"), "핵심");
  assert.equal(localization.localizeResearchDriverImportance("ko", "High"), "높음");
  assert.equal(localization.localizeResearchDriverImportance("ko", "Support"), "보조");
});

test("localizeResearchDriverDirection localizes known direction values in Korean", () => {
  assert.equal(typeof localization.localizeResearchDriverDirection, "function");
  assert.equal(localization.localizeResearchDriverDirection("ko", "higher"), "상방");
  assert.equal(localization.localizeResearchDriverDirection("ko", "lower"), "하방");
  assert.equal(localization.localizeResearchDriverDirection("ko", "context"), "맥락");
});

test("research driver metadata helpers keep English values unchanged", () => {
  assert.equal(localization.localizeResearchDriverImportance("en", "Core"), "Core");
  assert.equal(localization.localizeResearchDriverDirection("en", "higher"), "higher");
});

test("research driver metadata helpers fall back to raw values when they are unknown", () => {
  assert.equal(localization.localizeResearchDriverImportance("ko", "Unmapped"), "Unmapped");
  assert.equal(localization.localizeResearchDriverDirection("ko", "sideways"), "sideways");
});
