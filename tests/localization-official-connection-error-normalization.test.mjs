import assert from "node:assert/strict";
import test from "node:test";

import * as localization from "../src/lib/localization.ts";

test("localizeOfficialConnectionError matches known official errors case-insensitively in Korean", () => {
  const canonical = localization.localizeOfficialConnectionError(
    "ko",
    "KRX sample API returned no recent ETS rows."
  );

  assert.equal(
    localization.localizeOfficialConnectionError(
      "ko",
      "krx sample api returned no recent ets rows."
    ),
    canonical
  );
});
