import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeOfficialConnectionError localizes the KRX missing rows error in Korean", () => {
  assert.equal(typeof localization.localizeOfficialConnectionError, "function");
  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "KRX sample API returned no recent ETS rows."
    ),
    "KRX 샘플 API에서 최근 ETS 행을 찾지 못했습니다."
  );
});

test("localizeOfficialConnectionError keeps English copy unchanged", () => {
  assert.equal(typeof localization.localizeOfficialConnectionError, "function");
  assert.equal(
    localization.localizeOfficialConnectionError(
      "en",
      "KRX sample API returned no recent ETS rows."
    ),
    "KRX sample API returned no recent ETS rows."
  );
});

test("localizeOfficialConnectionError localizes the EEX missing workbook rows error in Korean", () => {
  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "No EEX auction rows were found in the official workbook."
    ),
    "공식 워크북에서 최신 경매 행을 찾지 못했습니다."
  );
});

test("localizeOfficialConnectionError localizes the KRX active KAU error in Korean", () => {
  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "KRX sample API did not return an active KAU instrument."
    ),
    "KRX 샘플 API에서 활성 KAU 종목을 찾지 못했습니다."
  );
});

test("localizeOfficialConnectionError localizes the KRX recent series error in Korean", () => {
  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "KRX sample API returned no recent series for the active allowance."
    ),
    "KRX 샘플 API에서 활성 배출권의 최근 시계열을 찾지 못했습니다."
  );
});

test("localizeOfficialConnectionError localizes the MEE missing entries error in Korean", () => {
  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "MEE list page returned no carbon-market entries."
    ),
    "MEE 목록 페이지에서 탄소시장 항목을 찾지 못했습니다."
  );
});
