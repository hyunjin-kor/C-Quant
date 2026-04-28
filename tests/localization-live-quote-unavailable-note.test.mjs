import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("live quote unavailable helper localizes structured source errors in Korean", () => {
  assert.equal(typeof localization.localizeLiveQuoteUnavailableNote, "function");
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "ko",
      "HTTP 403 from https://example.com/feed",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. 소스가 HTTP 403 응답을 반환했습니다."
  );
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "ko",
      "ERR_FEED_TIMEOUT: upstream timeout",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. 차트 피드 오류 코드 ERR_FEED_TIMEOUT가 반환됐습니다."
  );
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "ko",
      "No chart result returned for EUA1!.",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. EUA1! 차트 결과가 비어 있습니다."
  );
});

test("live quote unavailable helper localizes feed-resolution and generic fallbacks in Korean", () => {
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "ko",
      "No live quote could be resolved for ICE EUA December benchmark future",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. ICE EUA 12월 기준 선물에 대한 유효한 피드를 찾지 못했습니다."
  );
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "ko",
      "Internal vendor relay returned malformed payload",
      "ICE EUA 12월 기준 선물"
    ),
    "실시간 시세를 불러오지 못했습니다. 소스 응답을 다시 확인해야 합니다."
  );
});

test("live quote unavailable helper keeps English behavior intact", () => {
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "en",
      "HTTP 403 from https://example.com/feed",
      "ICE EUA December benchmark future"
    ),
    "Live quote unavailable. The source returned HTTP 403."
  );
  assert.equal(
    localization.localizeLiveQuoteUnavailableNote(
      "en",
      "No live quote could be resolved for ICE EUA December benchmark future",
      "ICE EUA December benchmark future"
    ),
    "Live quote unavailable. No valid feed could be resolved for ICE EUA December benchmark future."
  );
});
