import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("quote delay-note helper localizes known delay notes in Korean", () => {
  assert.equal(typeof localization.localizeQuoteDelayNoteLabel, "function");
  assert.equal(
    localization.localizeQuoteDelayNoteLabel(
      "ko",
      "Reference web chart feed. Exchange delay may apply.",
      "Benchmark futures"
    ),
    "참고용 웹 차트 소스입니다. 거래소 지연이 있을 수 있습니다."
  );
  assert.equal(
    localization.localizeQuoteDelayNoteLabel(
      "ko",
      "Reference web chart feed. Use as a listed proxy, not as the official carbon price.",
      "Listed proxy"
    ),
    "참고용 웹 차트 소스입니다. 공식 탄소 가격이 아니라 상장 대용지표로만 써야 합니다."
  );
});

test("quote delay-note helper localizes regex-style variants in Korean", () => {
  assert.equal(
    localization.localizeQuoteDelayNoteLabel(
      "ko",
      "Reference web chart feed. Intraday estimate from public page.",
      "Benchmark futures"
    ),
    "참고용 웹 차트 소스입니다. 거래소 지연이 있을 수 있습니다."
  );
  assert.equal(
    localization.localizeQuoteDelayNoteLabel(
      "ko",
      "Reference web chart feed. Internal vendor relay for listed proxy.",
      "Listed proxy"
    ),
    "참고용 웹 차트 소스입니다. 공식 탄소 가격이 아니라 상장 대용지표로만 써야 합니다."
  );
});

test("quote delay-note helper keeps English copy unchanged", () => {
  assert.equal(
    localization.localizeQuoteDelayNoteLabel(
      "en",
      "Reference web chart feed. Exchange delay may apply.",
      "Benchmark futures"
    ),
    "Reference web chart feed. Exchange delay may apply."
  );
});

test("quote delay-note helper falls back safely for empty and unknown values", () => {
  assert.equal(
    localization.localizeQuoteDelayNoteLabel("ko", "", "Listed proxy"),
    "지연 정보 없음"
  );
  assert.equal(
    localization.localizeQuoteDelayNoteLabel("ko", "Internal vendor relay", "Benchmark futures"),
    "시세 지연 주석은 원문 소스를 다시 확인해야 합니다."
  );
  assert.equal(
    localization.localizeQuoteDelayNoteLabel("en", "Internal vendor relay", "Benchmark futures"),
    "Internal vendor relay"
  );
});
