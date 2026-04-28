import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeMarketInputFieldDescription localizes known market-input descriptions in Korean", () => {
  assert.equal(typeof localization.localizeMarketInputFieldDescription, "function");
  assert.equal(
    localization.localizeMarketInputFieldDescription(
      "ko",
      "Latest auction date used by the official EU primary market card."
    ),
    "공식 EU 1차 시장 카드에 쓰는 최신 경매일입니다."
  );
  assert.equal(
    localization.localizeMarketInputFieldDescription(
      "ko",
      "Primary listed hedge tape used to compare against the official anchor."
    ),
    "공식 앵커와 비교할 때 쓰는 1차 상장 헤지 시세입니다."
  );
  assert.equal(
    localization.localizeMarketInputFieldDescription(
      "ko",
      "Internal policy timing overlay that keeps the operator focused on official releases."
    ),
    "운용자가 공식 발표에 계속 집중하도록 만드는 내부 정책 타이밍 오버레이입니다."
  );
});

test("localizeMarketInputFieldDescription keeps English descriptions unchanged", () => {
  assert.equal(
    localization.localizeMarketInputFieldDescription(
      "en",
      "Official daily closing price from the national carbon market bulletin."
    ),
    "Official daily closing price from the national carbon market bulletin."
  );
});

test("localizeMarketInputFieldDescription falls back to the raw description when it is unknown", () => {
  assert.equal(
    localization.localizeMarketInputFieldDescription("ko", "Unmapped field description"),
    "Unmapped field description"
  );
});
