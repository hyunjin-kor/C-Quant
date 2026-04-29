import { describe, it, expect } from "vitest";
import { rowsToMarkdown } from "../electron/exporters.js";

describe("rowsToMarkdown", () => {
  it("renders header + divider + rows", () => {
    const md = rowsToMarkdown([
      { name: "EU ETS", role: "primary" },
      { name: "K-ETS", role: "primary" }
    ]);
    const lines = md.split("\n");
    expect(lines[0]).toBe("| name | role |");
    expect(lines[1]).toBe("| --- | --- |");
    expect(lines[2]).toBe("| EU ETS | primary |");
  });

  it("escapes pipe characters in cells", () => {
    const md = rowsToMarkdown([{ note: "before|after" }]);
    expect(md).toContain("before\\|after");
  });

  it("collapses newlines inside cells", () => {
    const md = rowsToMarkdown([{ note: "line1\nline2" }]);
    expect(md).toContain("line1 line2");
  });

  it("uses explicit columns and missing fields", () => {
    const md = rowsToMarkdown([{ a: 1 }], ["a", "b"]);
    expect(md.split("\n")[2]).toBe("| 1 |  |");
  });

  it("rejects non-arrays", () => {
    expect(() => rowsToMarkdown("oops")).toThrow();
  });

  it("rejects empty schema", () => {
    expect(() => rowsToMarkdown([])).toThrow();
  });
});
