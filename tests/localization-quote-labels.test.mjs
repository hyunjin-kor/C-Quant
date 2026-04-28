import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("quote label helpers localize known quote titles in Korean", () => {
  assert.equal(typeof localization.localizeQuoteTitleLabel, "function");
  assert.equal(localization.localizeQuoteTitleLabel("ko", "eua-dec-benchmark", "ICE EUA December benchmark future"), "ICE EUA 12월 기준 선물");
  assert.equal(localization.localizeQuoteTitleLabel("ko", "ttf-gas-future", "Dutch TTF gas future"), "네덜란드 TTF 가스 선물");
  assert.equal(localization.localizeQuoteTitleLabel("ko", "brent-future", "Brent crude future"), "브렌트 원유 선물");
  assert.equal(localization.localizeQuoteTitleLabel("ko", "krbn-proxy", "KRBN global carbon ETF"), "KRBN 글로벌 탄소 ETF");
});

test("quote label helpers localize known quote categories in Korean", () => {
  assert.equal(typeof localization.localizeQuoteCategoryLabel, "function");
  assert.equal(localization.localizeQuoteCategoryLabel("ko", "Benchmark futures"), "기준 선물");
  assert.equal(localization.localizeQuoteCategoryLabel("ko", "Driver future"), "동인 선물");
  assert.equal(localization.localizeQuoteCategoryLabel("ko", "Listed proxy"), "상장 대용지표");
});

test("quote label helpers keep English values unchanged", () => {
  assert.equal(localization.localizeQuoteTitleLabel("en", "eua-dec-benchmark", "ICE EUA December benchmark future"), "ICE EUA December benchmark future");
  assert.equal(localization.localizeQuoteCategoryLabel("en", "Listed proxy"), "Listed proxy");
});

test("quote label helpers fall back safely for unknown inputs", () => {
  assert.equal(localization.localizeQuoteTitleLabel("ko", "custom-quote", "Custom structured product"), "Custom structured product");
  assert.equal(localization.localizeQuoteCategoryLabel("ko", "Cross-market sleeve"), "Cross-market sleeve");
  assert.equal(localization.localizeQuoteTitleLabel("ko", "", ""), "시세 없음");
  assert.equal(localization.localizeQuoteCategoryLabel("ko", ""), "분류 없음");
});
