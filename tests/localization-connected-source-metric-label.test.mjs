import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeConnectedSourceMetricLabel localizes known official metric labels in Korean", () => {
  assert.equal(typeof localization.localizeConnectedSourceMetricLabel, "function");
  assert.equal(localization.localizeConnectedSourceMetricLabel("ko", "Auction price"), "경매 가격");
  assert.equal(
    localization.localizeConnectedSourceMetricLabel("ko", "Auction volume"),
    "경매 물량"
  );
  assert.equal(localization.localizeConnectedSourceMetricLabel("ko", "Cover ratio"), "커버 비율");
  assert.equal(localization.localizeConnectedSourceMetricLabel("ko", "Close"), "종가");
  assert.equal(
    localization.localizeConnectedSourceMetricLabel("ko", "20d avg volume"),
    "20일 평균 거래량"
  );
  assert.equal(
    localization.localizeConnectedSourceMetricLabel("ko", "Annual turnover"),
    "연간 거래대금"
  );
});

test("localizeConnectedSourceMetricLabel keeps English metric labels unchanged", () => {
  assert.equal(
    localization.localizeConnectedSourceMetricLabel("en", "Auction price"),
    "Auction price"
  );
  assert.equal(localization.localizeConnectedSourceMetricLabel("en", "Close"), "Close");
});

test("localizeConnectedSourceMetricLabel falls back to the raw label when it is unknown", () => {
  assert.equal(
    localization.localizeConnectedSourceMetricLabel("ko", "Unmapped metric"),
    "Unmapped metric"
  );
});
