import { describe, it, expect } from "vitest";
import { tt, hasKey } from "../src/lib/i18n";

describe("i18n catalog", () => {
  it("returns Korean for ko locale", () => {
    expect(tt("ko", "watchlist.title")).toBe("워치리스트");
  });

  it("returns English for en locale", () => {
    expect(tt("en", "watchlist.title")).toBe("Watchlist");
  });

  it("interpolates {{}} parameters", () => {
    const out = tt("en", "update.available.body", { version: "1.2.3" });
    expect(out).toContain("1.2.3");
  });

  it("returns the key for missing entries", () => {
    expect(tt("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("hasKey reflects the catalog", () => {
    expect(hasKey("watchlist.title")).toBe(true);
    expect(hasKey("does.not.exist")).toBe(false);
  });
});
