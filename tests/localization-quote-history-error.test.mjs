import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("quote history error helper localizes invalid quote configuration errors in Korean", () => {
  assert.equal(typeof localization.localizeQuoteHistoryErrorLabel, "function");
  assert.equal(
    localization.localizeQuoteHistoryErrorLabel(
      "ko",
      "Unknown live quote: eua-dec-benchmark",
      "ICE EUA 12월 기준 선물"
    ),
    "ICE EUA 12월 기준 선물 이력 요청 구성이 유효하지 않습니다. 비교 시세를 다시 선택해 확인해야 합니다."
  );
  assert.equal(
    localization.localizeQuoteHistoryErrorLabel(
      "ko",
      "invalid quote id",
      "ICE EUA 12월 기준 선물"
    ),
    "ICE EUA 12월 기준 선물 이력 요청 구성이 유효하지 않습니다. 비교 시세를 다시 선택해 확인해야 합니다."
  );
});

test("quote history error helper localizes invalid range errors in Korean", () => {
  assert.equal(
    localization.localizeQuoteHistoryErrorLabel(
      "ko",
      "invalid range id",
      "ICE EUA 12월 기준 선물"
    ),
    "비교 시세 이력 구간 설정이 유효하지 않습니다. 기본 구간으로 다시 확인해야 합니다."
  );
});

test("quote history error helper delegates fallback errors through live-quote unavailable copy", () => {
  assert.equal(
    localization.localizeQuoteHistoryErrorLabel(
      "ko",
      "HTTP 403 from https://example.com/feed",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. 소스가 HTTP 403 응답을 반환했습니다."
  );
  assert.equal(
    localization.localizeQuoteHistoryErrorLabel(
      "en",
      "HTTP 403 from https://example.com/feed",
      "ICE EUA December benchmark future"
    ),
    "Live quote unavailable. The source returned HTTP 403."
  );
});
