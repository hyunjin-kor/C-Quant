import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeResearchDriverCategory localizes known research driver categories in Korean", () => {
  assert.equal(typeof localization.localizeResearchDriverCategory, "function");
  assert.equal(localization.localizeResearchDriverCategory("ko", "Policy Supply"), "정책 공급");
  assert.equal(
    localization.localizeResearchDriverCategory("ko", "Market Microstructure"),
    "시장 미시구조"
  );
  assert.equal(
    localization.localizeResearchDriverCategory("ko", "Policy Implementation"),
    "정책 이행"
  );
});

test("localizeResearchDriverCategory keeps English categories unchanged", () => {
  assert.equal(
    localization.localizeResearchDriverCategory("en", "Macro and Financial"),
    "Macro and Financial"
  );
});

test("localizeResearchDriverCategory falls back to the raw category when it is unknown", () => {
  assert.equal(
    localization.localizeResearchDriverCategory("ko", "Unmapped Category"),
    "Unmapped Category"
  );
});
