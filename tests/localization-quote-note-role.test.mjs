import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("quote note helper localizes known note copy in Korean", () => {
  assert.equal(typeof localization.localizeQuoteNoteLabel, "function");
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "ko",
      "eua-dec-benchmark",
      "December benchmark contract used as the main listed EUA reference. Some free chart feeds expose the live price faster than the full historical curve."
    ),
    "EUA 상장 기준으로 쓰는 12월물입니다. 일부 무료 차트 피드는 전체 이력보다 최신 가격을 더 빨리 보여줄 수 있습니다."
  );
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "ko",
      "krbn-proxy",
      "Proxy only. Do not treat this as an official local ETS settlement."
    ),
    "대용지표 전용입니다. 공식 현지 배출권거래제 정산값처럼 읽으면 안 됩니다."
  );
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "ko",
      "ttf-gas-future",
      "Gas remains one of the key inputs behind short-term carbon repricing."
    ),
    "가스는 단기 탄소 재가격 형성에 계속 들어가는 핵심 입력 변수입니다."
  );
});

test("quote note helper localizes regex-style note variants and stable fallback in Korean", () => {
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "ko",
      "custom-proxy",
      "Proxy only. The official listed hedge anchor remains the ICE EUA future."
    ),
    "대용지표 전용입니다. 공식 상장 헤지 기준은 ICE EUA 선물로 유지해야 합니다."
  );
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "ko",
      "custom-quote",
      "Internal vendor relay note"
    ),
    "비교 시세 비고는 원문 소스를 다시 확인해야 합니다."
  );
  assert.equal(localization.localizeQuoteNoteLabel("ko", "", ""), "메모 없음");
});

test("quote role helper localizes known role copy in Korean", () => {
  assert.equal(typeof localization.localizeQuoteRoleLabel, "function");
  assert.equal(
    localization.localizeQuoteRoleLabel(
      "ko",
      "eua-dec-benchmark",
      "Primary listed hedge tape for EU carbon risk"
    ),
    "EU 탄소 리스크용 1차 상장 헤지 시세"
  );
  assert.equal(
    localization.localizeQuoteRoleLabel(
      "ko",
      "krbn-proxy",
      "Listed carbon proxy when local ETS futures are not available"
    ),
    "현지 배출권거래제 선물이 없을 때 쓰는 상장 탄소 대용지표"
  );
  assert.equal(
    localization.localizeQuoteRoleLabel("ko", "brent-future", "Macro energy proxy"),
    "거시 에너지 대용지표"
  );
});

test("quote role helper localizes regex-style role variants and stable fallback in Korean", () => {
  assert.equal(
    localization.localizeQuoteRoleLabel("ko", "custom-quote", "Fuel-switching driver for EU carbon"),
    "탄소용 연료 전환 동인"
  );
  assert.equal(
    localization.localizeQuoteRoleLabel("ko", "custom-quote", "Internal vendor relay role"),
    "비교 시세 역할 문구는 원문 소스를 다시 확인해야 합니다."
  );
  assert.equal(localization.localizeQuoteRoleLabel("ko", "", ""), "역할 정보 없음");
});

test("quote note and role helpers keep English values unchanged", () => {
  assert.equal(
    localization.localizeQuoteNoteLabel(
      "en",
      "ttf-gas-future",
      "Gas remains one of the key inputs behind short-term carbon repricing."
    ),
    "Gas remains one of the key inputs behind short-term carbon repricing."
  );
  assert.equal(
    localization.localizeQuoteRoleLabel("en", "brent-future", "Macro energy proxy"),
    "Macro energy proxy"
  );
});
