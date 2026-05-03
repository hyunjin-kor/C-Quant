import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createInstitutionalFeedRegistry,
  createRefinitivAdapter,
  createBloombergAdapter,
  createIceConsolidatedAdapter,
  createEexExchangeAdapter
} from "../electron/institutionalFeeds.js";

const ENV_KEYS = [
  "CQUANT_REFINITIV_APP_KEY",
  "CQUANT_REFINITIV_USERNAME",
  "CQUANT_BLOOMBERG_HOST",
  "CQUANT_BLOOMBERG_PORT",
  "CQUANT_ICE_API_KEY",
  "CQUANT_EEX_API_KEY"
];

let savedEnv;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("institutional feed adapters", () => {
  it("Refinitiv reports not-configured when env vars are missing", async () => {
    const adapter = createRefinitivAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("not-configured");
    expect(status.docUrl).toContain("lseg.com");
  });

  it("Refinitiv reports ready when both env vars are present", async () => {
    process.env.CQUANT_REFINITIV_APP_KEY = "abc";
    process.env.CQUANT_REFINITIV_USERNAME = "user";
    const adapter = createRefinitivAdapter();
    const status = await adapter.status();
    expect(status.status).toBe("ready");
  });

  it("Bloomberg requires both host and port", async () => {
    process.env.CQUANT_BLOOMBERG_HOST = "bpipe.local";
    const adapter = createBloombergAdapter();
    const noPort = await adapter.status();
    expect(noPort.status).toBe("not-configured");
    process.env.CQUANT_BLOOMBERG_PORT = "8194";
    const ready = await adapter.status();
    expect(ready.status).toBe("ready");
  });

  it("ICE adapter gates on CQUANT_ICE_API_KEY", async () => {
    const adapter = createIceConsolidatedAdapter();
    expect((await adapter.status()).status).toBe("not-configured");
    process.env.CQUANT_ICE_API_KEY = "key";
    expect((await adapter.status()).status).toBe("ready");
  });

  it("EEX adapter gates on CQUANT_EEX_API_KEY", async () => {
    const adapter = createEexExchangeAdapter();
    expect((await adapter.status()).status).toBe("not-configured");
    process.env.CQUANT_EEX_API_KEY = "k";
    expect((await adapter.status()).status).toBe("ready");
  });

  it("fetchQuote returns null when adapter is not configured", async () => {
    const adapter = createRefinitivAdapter();
    const quote = await adapter.fetchQuote("EUA=");
    expect(quote).toBeNull();
  });
});

describe("institutional feed registry", () => {
  it("lists all four adapters", () => {
    const registry = createInstitutionalFeedRegistry();
    const ids = registry.list().map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining(["refinitiv", "bloomberg", "ice-consolidated", "eex-exchange"])
    );
    expect(ids).toHaveLength(4);
  });

  it("getStatuses returns a status entry per adapter", async () => {
    const registry = createInstitutionalFeedRegistry();
    const statuses = await registry.getStatuses();
    expect(statuses).toHaveLength(4);
    for (const s of statuses) {
      expect(s.status).toBe("not-configured");
      expect(typeof s.message).toBe("string");
    }
  });

  it("fetchQuote refuses to call adapter that is not ready", async () => {
    const registry = createInstitutionalFeedRegistry();
    const result = await registry.fetchQuote("refinitiv", "EUA=");
    expect(result).toBeNull();
  });

  it("fetchQuote with unknown adapter id returns null", async () => {
    const registry = createInstitutionalFeedRegistry();
    const result = await registry.fetchQuote("does-not-exist", "X");
    expect(result).toBeNull();
  });
});
