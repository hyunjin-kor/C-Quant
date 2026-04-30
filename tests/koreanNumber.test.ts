import { describe, it, expect } from "vitest";
import { formatKoreanNumber, formatLocalizedNumber } from "../src/lib/koreanNumber";

describe("formatKoreanNumber", () => {
  it("renders sub-만 values with comma grouping", () => {
    expect(formatKoreanNumber(9999)).toBe("9,999");
    expect(formatKoreanNumber(78.42)).toBe("78.42");
  });

  it("renders 만 unit at the 10,000 boundary", () => {
    expect(formatKoreanNumber(10_000)).toBe("1만");
    expect(formatKoreanNumber(95_200)).toBe("9.52만");
    expect(formatKoreanNumber(9_520_000)).toBe("952만");
  });

  it("renders 억 unit at the 100,000,000 boundary", () => {
    expect(formatKoreanNumber(100_000_000)).toBe("1억");
    expect(formatKoreanNumber(125_000_000)).toBe("1.25억");
    expect(formatKoreanNumber(9_876_543_210)).toBe("98.77억");
  });

  it("renders 조 unit beyond 1 trillion", () => {
    expect(formatKoreanNumber(1_500_000_000_000)).toBe("1.5조");
  });

  it("trims trailing zeros in the fractional part", () => {
    expect(formatKoreanNumber(20_000)).toBe("2만");
    expect(formatKoreanNumber(200_000_000)).toBe("2억");
  });

  it("respects custom precision", () => {
    expect(formatKoreanNumber(125_000_000, { precision: 0 })).toBe("1억");
    expect(formatKoreanNumber(125_500_000, { precision: 4 })).toBe("1.255억");
  });

  it("prefixes a currency glyph when supplied", () => {
    expect(formatKoreanNumber(9_520_000, { currency: "KRW" })).toBe("₩952만");
    expect(formatKoreanNumber(125_000_000, { currency: "CNY" })).toBe("¥1.25억");
    expect(formatKoreanNumber(78.42, { currency: "EUR" })).toBe("€78.42");
  });

  it("preserves negative sign", () => {
    expect(formatKoreanNumber(-9_520_000)).toBe("-952만");
    expect(formatKoreanNumber(-9_520_000, { currency: "KRW" })).toBe("₩-952만");
  });

  it("falls back to String for non-finite input", () => {
    expect(formatKoreanNumber(NaN)).toBe("NaN");
    expect(formatKoreanNumber(Infinity)).toBe("Infinity");
  });
});

describe("formatLocalizedNumber", () => {
  it("uses Korean unit formatting for ko locale", () => {
    expect(formatLocalizedNumber(9_520_000, "ko", { currency: "KRW" })).toBe("₩952만");
  });

  it("uses western grouping for en locale", () => {
    expect(formatLocalizedNumber(9_520_000, "en", { currency: "KRW" })).toBe("₩9,520,000");
  });

  it("respects precision in en locale", () => {
    expect(formatLocalizedNumber(78.4567, "en", { precision: 2 })).toBe("78.46");
  });
});
