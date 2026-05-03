import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createFreeFeedRegistry,
  createFredAdapter,
  createEcbSdwAdapter,
  createIcapAdapter,
  createWorldBankCarbonAdapter
} from "../electron/freeFeeds.js";

let savedFred;

beforeEach(() => {
  savedFred = process.env.CQUANT_FRED_API_KEY;
  delete process.env.CQUANT_FRED_API_KEY;
});

afterEach(() => {
  if (savedFred === undefined) delete process.env.CQUANT_FRED_API_KEY;
  else process.env.CQUANT_FRED_API_KEY = savedFred;
});

describe("free public-data feed adapters", () => {
  it("FRED reports not-configured when no API key", async () => {
    const adapter = createFredAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("not-configured");
    expect(status.docUrl).toContain("fredaccount.stlouisfed.org");
  });

  it("FRED reports ready when key is set", async () => {
    process.env.CQUANT_FRED_API_KEY = "test-key";
    const adapter = createFredAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("ready");
  });

  it("FRED fetchSeries returns null without an API key", async () => {
    const adapter = createFredAdapter();
    const series = await adapter.fetchSeries("DGS10");
    expect(series).toBeNull();
  });

  it("ECB SDW is always ready (no key required)", async () => {
    const adapter = createEcbSdwAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("ready");
    expect(status.docUrl).toContain("ecb.europa.eu");
  });

  it("ICAP adapter exposes a downloadable dashboard URL", async () => {
    const adapter = createIcapAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("ready");
    const url = await adapter.getDownloadUrl();
    expect(url).toContain("icapcarbonaction.com");
  });

  it("World Bank adapter exposes a dashboard URL", async () => {
    const adapter = createWorldBankCarbonAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("ready");
    const url = await adapter.getDashboardUrl();
    expect(url).toContain("worldbank.org");
  });
});

describe("free feed registry", () => {
  it("lists all four adapters", () => {
    const registry = createFreeFeedRegistry();
    const ids = registry.list().map((entry) => entry.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "fred",
        "ecb-sdw",
        "icap-allowance-price-explorer",
        "world-bank-carbon-pricing-dashboard"
      ])
    );
  });

  it("getStatuses returns one status per adapter", async () => {
    const registry = createFreeFeedRegistry();
    const statuses = await registry.getStatuses();
    expect(statuses).toHaveLength(4);
    for (const s of statuses) {
      expect(["ready", "not-configured", "error"]).toContain(s.status);
    }
  });

  it("fetchSeries returns null for adapters that do not implement it", async () => {
    const registry = createFreeFeedRegistry();
    const result = await registry.fetchSeries("icap-allowance-price-explorer", "anything");
    expect(result).toBeNull();
  });

  it("fetchSeries with unknown adapter id returns null", async () => {
    const registry = createFreeFeedRegistry();
    const result = await registry.fetchSeries("does-not-exist", "X");
    expect(result).toBeNull();
  });
});
