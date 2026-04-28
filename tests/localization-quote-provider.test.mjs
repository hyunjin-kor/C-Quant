import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("quote provider helper localizes known provider labels in Korean", () => {
  assert.equal(typeof localization.localizeQuoteProviderLabel, "function");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Yahoo Finance web chart feed"), "Yahoo Finance 웹 차트 소스");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Official web flow"), "공식 웹 플로우");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Official file"), "공식 파일");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Commercial API"), "상용 API");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Public API"), "공개 API");
});

test("quote provider helper handles regex-style provider variants in Korean", () => {
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Yahoo Finance delayed web chart feed"), "Yahoo Finance 웹 차트 소스");
  assert.equal(localization.localizeQuoteProviderLabel("ko", "Internal web chart feed"), "참고용 웹 차트 소스");
});

test("quote provider helper keeps English provider labels unchanged", () => {
  assert.equal(localization.localizeQuoteProviderLabel("en", "Yahoo Finance web chart feed"), "Yahoo Finance web chart feed");
  assert.equal(localization.localizeQuoteProviderLabel("en", "Commercial API"), "Commercial API");
});

test("quote provider helper returns stable fallbacks for empty and unknown values", () => {
  assert.equal(localization.localizeQuoteProviderLabel("ko", ""), "없음");
  assert.equal(localization.localizeQuoteProviderLabel("en", ""), "n/a");
  assert.equal(
    localization.localizeQuoteProviderLabel("ko", "Internal vendor relay"),
    "제공자 표기는 원문 소스를 다시 확인해야 합니다."
  );
  assert.equal(localization.localizeQuoteProviderLabel("en", "Internal vendor relay"), "Internal vendor relay");
});
