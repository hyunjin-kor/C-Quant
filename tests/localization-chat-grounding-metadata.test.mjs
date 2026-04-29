import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("chat grounding metadata helpers localize known kind values in Korean", () => {
  assert.equal(typeof localization.localizeChatGroundingKind, "function");
  assert.equal(localization.localizeChatGroundingKind("ko", "Official anchor"), "공식 앵커");
  assert.equal(localization.localizeChatGroundingKind("ko", "Listed comparison"), "상장 비교");
  assert.equal(localization.localizeChatGroundingKind("ko", "Official context"), "공식 맥락");
  assert.equal(localization.localizeChatGroundingKind("ko", "Source freshness"), "소스 신선도");
  assert.equal(localization.localizeChatGroundingKind("ko", "Key driver"), "핵심 드라이버");
  assert.equal(localization.localizeChatGroundingKind("ko", "Accounting control"), "회계 통제");
});

test("chat grounding metadata helpers localize known reliance values in Korean", () => {
  assert.equal(typeof localization.localizeChatGroundingReliance, "function");
  assert.equal(localization.localizeChatGroundingReliance("ko", "Primary evidence"), "핵심 근거");
  assert.equal(localization.localizeChatGroundingReliance("ko", "Context signal"), "맥락 신호");
  assert.equal(localization.localizeChatGroundingReliance("ko", "Proxy benchmark"), "프록시 비교");
  assert.equal(
    localization.localizeChatGroundingReliance("ko", "Research driver"),
    "연구 드라이버"
  );
  assert.equal(localization.localizeChatGroundingReliance("ko", "Accounting control"), "회계 통제");
});

test("chat grounding metadata helpers keep English values unchanged", () => {
  assert.equal(localization.localizeChatGroundingKind("en", "Official anchor"), "Official anchor");
  assert.equal(
    localization.localizeChatGroundingReliance("en", "Primary evidence"),
    "Primary evidence"
  );
});

test("chat grounding metadata helpers fall back to raw values when they are unknown", () => {
  assert.equal(localization.localizeChatGroundingKind("ko", "Supplement"), "Supplement");
  assert.equal(localization.localizeChatGroundingReliance("ko", "Secondary"), "Secondary");
});
