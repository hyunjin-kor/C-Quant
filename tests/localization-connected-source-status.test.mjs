import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeConnectedSourceStatus localizes known connected-source statuses in Korean", () => {
  assert.equal(typeof localization.localizeConnectedSourceStatus, "function");
  assert.equal(localization.localizeConnectedSourceStatus("ko", "connected"), "연결됨");
  assert.equal(localization.localizeConnectedSourceStatus("ko", "limited"), "제한");
  assert.equal(localization.localizeConnectedSourceStatus("ko", "error"), "오류");
});

test("localizeConnectedSourceStatus keeps English statuses unchanged", () => {
  assert.equal(localization.localizeConnectedSourceStatus("en", "connected"), "connected");
  assert.equal(localization.localizeConnectedSourceStatus("en", "limited"), "limited");
  assert.equal(localization.localizeConnectedSourceStatus("en", "error"), "error");
});

test("localizeConnectedSourceStatus falls back to the raw status when it is unknown", () => {
  assert.equal(localization.localizeConnectedSourceStatus("ko", "degraded"), "degraded");
});
