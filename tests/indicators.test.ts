import { describe, it, expect } from "vitest";
import { sma, ema, rsi, bollinger, logReturns, correlation } from "../src/lib/indicators";

describe("sma", () => {
  it("rejects invalid periods", () => {
    expect(() => sma([1, 2], 0)).toThrow();
    expect(() => sma([1, 2], -1)).toThrow();
    expect(() => sma([1, 2], 1.5)).toThrow();
  });

  it("returns nulls for the first period-1 slots", () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBeCloseTo(2);
    expect(out[3]).toBeCloseTo(3);
    expect(out[4]).toBeCloseTo(4);
  });

  it("returns null for windows containing non-finite values", () => {
    const out = sma([1, NaN, 3, 4, 5], 3);
    expect(out[2]).toBeNull();
    expect(out[3]).toBeNull();
    expect(out[4]).toBeCloseTo(4);
  });
});

describe("ema", () => {
  it("seeds with sma and converges towards a flat input", () => {
    const out = ema([10, 10, 10, 10, 10, 10], 3);
    expect(out[2]).toBeCloseTo(10);
    expect(out[5]).toBeCloseTo(10);
  });

  it("reacts faster than sma after a step change", () => {
    // Flat baseline followed by a sudden jump — EMA should rise above SMA
    // on the first sample after the step because EMA weights recent values
    // exponentially while SMA averages a fixed window.
    const series = [10, 10, 10, 10, 10, 10, 100];
    const e = ema(series, 3);
    const s = sma(series, 3);
    expect((e[6] as number) > (s[6] as number)).toBe(true);
  });
});

describe("rsi", () => {
  it("returns 100 when there are no losses", () => {
    const out = rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14);
    expect(out[14]).toBeCloseTo(100);
  });

  it("stays in 0..100", () => {
    const series = [10, 12, 11, 13, 14, 12, 11, 14, 15, 16, 14, 13, 15, 17, 16, 14, 13, 15, 16, 18];
    const out = rsi(series, 14);
    for (const value of out) {
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("bollinger", () => {
  it("middle equals SMA, bands symmetric", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const bands = bollinger(values, 5, 2);
    const last = bands[bands.length - 1];
    expect(last.middle).toBeCloseTo(18);
    if (last.upper !== null && last.lower !== null && last.middle !== null) {
      expect(last.upper - last.middle).toBeCloseTo(last.middle - last.lower);
    }
  });
});

describe("logReturns", () => {
  it("first slot is null", () => {
    const r = logReturns([1, 2]);
    expect(r[0]).toBeNull();
    expect(r[1]).toBeCloseTo(Math.log(2));
  });

  it("skips non-finite or non-positive values", () => {
    const r = logReturns([1, 0, 2, -1, 3]);
    expect(r[1]).toBeNull();
    expect(r[3]).toBeNull();
  });
});

describe("correlation", () => {
  it("returns 1 for identical series", () => {
    expect(correlation([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBeCloseTo(1);
  });

  it("returns -1 for negated series", () => {
    expect(correlation([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
  });

  it("returns null when one side is constant", () => {
    expect(correlation([1, 2, 3], [4, 4, 4])).toBeNull();
  });

  it("rejects mismatched lengths", () => {
    expect(() => correlation([1, 2], [1, 2, 3])).toThrow();
  });
});
