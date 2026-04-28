import { describe, it, expect, beforeEach, vi } from "vitest";
import analytics from "../electron/analytics.js";

describe("analytics opt-in", () => {
  beforeEach(() => {
    analytics.__resetForTests();
    delete process.env.CQUANT_ANALYTICS_ENDPOINT;
  });

  it("does not contact the network when opted out", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve());
    globalThis.fetch = fetchSpy;
    analytics.init({ enabled: false, app: { version: "test" } });
    analytics.track("event.x", { ok: true });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not contact the network without an endpoint", async () => {
    const fetchSpy = vi.fn(() => Promise.resolve());
    globalThis.fetch = fetchSpy;
    analytics.init({ enabled: true, app: {} });
    analytics.track("event.x", { ok: true });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to the endpoint when both flags align", async () => {
    process.env.CQUANT_ANALYTICS_ENDPOINT = "https://example.test/ingest";
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    globalThis.fetch = fetchSpy;
    analytics.init({ enabled: true, app: { version: "test" } });
    analytics.track("event.x", { ok: true });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://example.test/ingest");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.name).toBe("event.x");
    expect(body.properties).toEqual({ ok: true });
    expect(typeof body.timestamp).toBe("string");
  });

  it("rejects properties that are not primitive", () => {
    const longKey = "x".repeat(100);
    const cleaned = analytics.sanitizeProperties({
      ok: true,
      name: "value",
      n: 42,
      nested: { drop: 1 },
      list: [1, 2],
      [longKey]: "too-long-key"
    });
    expect(cleaned).toEqual({ ok: true, name: "value", n: 42 });
  });
});
