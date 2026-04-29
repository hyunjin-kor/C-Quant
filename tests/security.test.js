import { describe, it, expect } from "vitest";
import {
  buildContentSecurityPolicy,
  escapeHtml,
  isTrustedAppUrl,
  normalizeExternalUrl,
  sanitizeQuoteHistoryPayload
} from "../electron/security.js";

describe("normalizeExternalUrl", () => {
  it("accepts http and https", () => {
    expect(normalizeExternalUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(normalizeExternalUrl("http://example.com/")).toBe("http://example.com/");
  });

  it("rejects javascript: and file:", () => {
    expect(() => normalizeExternalUrl("javascript:alert(1)")).toThrow(/http and https/);
    expect(() => normalizeExternalUrl("file:///etc/passwd")).toThrow(/http and https/);
  });

  it("rejects malformed input", () => {
    expect(() => normalizeExternalUrl("not a url")).toThrow(/must be a valid URL/);
    expect(() => normalizeExternalUrl("")).toThrow(/must be a valid URL/);
  });
});

describe("sanitizeQuoteHistoryPayload", () => {
  it("accepts a valid id and range", () => {
    expect(sanitizeQuoteHistoryPayload({ quoteId: "eua-dec-benchmark", range: "1m" })).toEqual({
      quoteId: "eua-dec-benchmark",
      range: "1m"
    });
  });

  it("falls back to default range", () => {
    expect(sanitizeQuoteHistoryPayload({ quoteId: "krbn-proxy" }).range).toBe("3m");
  });

  it("rejects path traversal", () => {
    expect(() =>
      sanitizeQuoteHistoryPayload({ quoteId: "../../etc/passwd", range: "1m" })
    ).toThrow(/invalid quote id/);
  });

  it("rejects unknown range", () => {
    expect(() => sanitizeQuoteHistoryPayload({ quoteId: "valid", range: "100y" })).toThrow(
      /invalid range id/
    );
  });

  it("rejects oversized id", () => {
    expect(() => sanitizeQuoteHistoryPayload({ quoteId: "a".repeat(65), range: "1m" })).toThrow(
      /invalid quote id/
    );
  });

  it("rejects empty id", () => {
    expect(() => sanitizeQuoteHistoryPayload({ quoteId: "", range: "1m" })).toThrow();
  });
});

describe("isTrustedAppUrl", () => {
  const rendererEntryPath = "/app/dist/index.html";

  it("trusts dev server origins in dev", () => {
    expect(isTrustedAppUrl("http://localhost:5173/", { isDev: true, rendererEntryPath })).toBe(true);
    expect(
      isTrustedAppUrl("http://127.0.0.1:5173/index.html", { isDev: true, rendererEntryPath })
    ).toBe(true);
  });

  it("rejects unknown origins", () => {
    expect(
      isTrustedAppUrl("http://evil.example.com/", { isDev: true, rendererEntryPath })
    ).toBe(false);
  });

  it("rejects file URLs in dev", () => {
    expect(
      isTrustedAppUrl("file:///app/dist/index.html", { isDev: true, rendererEntryPath })
    ).toBe(false);
  });

  it("rejects empty / malformed", () => {
    expect(isTrustedAppUrl("", { isDev: true, rendererEntryPath })).toBe(false);
    expect(isTrustedAppUrl("not a url", { isDev: true, rendererEntryPath })).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapes the standard set", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
  });

  it("handles ampersands and null", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("buildContentSecurityPolicy", () => {
  it("does not include unsafe-inline for scripts in production", () => {
    const csp = buildContentSecurityPolicy({ isDev: false });
    const scriptDirective = csp.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptDirective).toBeDefined();
    expect(scriptDirective).not.toMatch(/unsafe-inline/);
    expect(scriptDirective).not.toMatch(/unsafe-eval/);
    expect(scriptDirective).not.toMatch(/localhost/);
  });

  it("includes Vite HMR allowances in dev", () => {
    const csp = buildContentSecurityPolicy({ isDev: true });
    expect(csp).toMatch(/'unsafe-inline'/);
    expect(csp).toMatch(/ws:\/\/localhost:5173/);
    expect(csp).toMatch(/http:\/\/localhost:5173/);
  });

  it("always lists official market origins in connect-src", () => {
    for (const isDev of [true, false]) {
      const csp = buildContentSecurityPolicy({ isDev });
      expect(csp).toMatch(/https:\/\/www\.eex\.com/);
      expect(csp).toMatch(/https:\/\/ets\.krx\.co\.kr/);
      expect(csp).toMatch(/https:\/\/query1\.finance\.yahoo\.com/);
      expect(csp).toMatch(/https:\/\/www\.mee\.gov\.cn/);
    }
  });

  it("denies framing", () => {
    const csp = buildContentSecurityPolicy({ isDev: false });
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });
});
