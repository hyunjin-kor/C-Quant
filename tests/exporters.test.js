import { describe, it, expect } from "vitest";
import { rowsToCsv, quoteCsvCell } from "../electron/exporters.js";

describe("quoteCsvCell", () => {
  it("returns a plain string when no quoting is needed", () => {
    expect(quoteCsvCell("hello")).toBe("hello");
  });

  it("quotes commas, quotes, and newlines", () => {
    expect(quoteCsvCell("a, b")).toBe('"a, b"');
    expect(quoteCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(quoteCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(quoteCsvCell("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("handles null/undefined", () => {
    expect(quoteCsvCell(null)).toBe("");
    expect(quoteCsvCell(undefined)).toBe("");
  });

  it("stringifies numbers", () => {
    expect(quoteCsvCell(3.14)).toBe("3.14");
  });
});

describe("rowsToCsv", () => {
  it("infers columns from object keys when not provided", () => {
    const csv = rowsToCsv([
      { a: 1, b: 2 },
      { a: 3, b: 4 }
    ]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("respects explicit column order and missing fields", () => {
    const csv = rowsToCsv([{ a: 1, b: 2 }, { a: 3 }], ["b", "a", "c"]);
    expect(csv).toBe("b,a,c\r\n2,1,\r\n,3,");
  });

  it("escapes correctly when cells contain special characters", () => {
    const csv = rowsToCsv([{ name: 'She said "hello"', note: "1, 2, 3" }]);
    expect(csv).toBe('name,note\r\n"She said ""hello""","1, 2, 3"');
  });

  it("rejects non-arrays", () => {
    expect(() => rowsToCsv("oops")).toThrow(/array of rows/);
  });

  it("rejects empty schema", () => {
    expect(() => rowsToCsv([])).toThrow(/at least one column/);
  });
});
