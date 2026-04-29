"use strict";

/**
 * Export helpers for surfaces that need to share or archive their state.
 *
 *   - exportRendererToPdf: uses Electron's printToPDF from the active
 *     BrowserWindow's webContents. The renderer can wrap a section in
 *     a print stylesheet to control what gets captured.
 *   - exportRowsToCsv: serializes an array of records to CSV with
 *     RFC 4180 quoting. Lives in the main process so the renderer can
 *     be sandboxed without giving it filesystem access.
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const { dialog } = require("electron");

function quoteCsvCell(value) {
  if (value === null || value === undefined) return "";
  const stringified = String(value);
  if (/[",\r\n]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
}

function rowsToCsv(rows, columns) {
  if (!Array.isArray(rows)) {
    throw new Error("CSV export requires an array of rows.");
  }

  let resolvedColumns = Array.isArray(columns) && columns.length > 0 ? columns : null;
  if (!resolvedColumns) {
    const seen = new Set();
    for (const row of rows) {
      if (row && typeof row === "object") {
        for (const key of Object.keys(row)) {
          seen.add(key);
        }
      }
    }
    resolvedColumns = Array.from(seen);
  }

  if (resolvedColumns.length === 0) {
    throw new Error("CSV export needs at least one column.");
  }

  const lines = [resolvedColumns.map(quoteCsvCell).join(",")];
  for (const row of rows) {
    const cells = resolvedColumns.map((column) =>
      quoteCsvCell(row && typeof row === "object" ? row[column] : "")
    );
    lines.push(cells.join(","));
  }
  return lines.join("\r\n");
}

async function writeFileWithDialog({ window, defaultName, content, filters }) {
  const result = await dialog.showSaveDialog(window || undefined, {
    defaultPath: defaultName,
    filters: filters || []
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  await fs.mkdir(path.dirname(result.filePath), { recursive: true });
  await fs.writeFile(result.filePath, content, "utf8");
  return { canceled: false, filePath: result.filePath };
}

async function exportCsv({ window, payload }) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const columns = Array.isArray(payload?.columns) ? payload.columns : null;
  const defaultName = String(payload?.defaultName ?? "c-quant-export.csv").slice(0, 200);
  const csv = rowsToCsv(rows, columns);
  return writeFileWithDialog({
    window,
    defaultName,
    content: csv,
    filters: [
      { name: "CSV (Comma separated)", extensions: ["csv"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
}

function rowsToMarkdown(rows, columns) {
  if (!Array.isArray(rows)) {
    throw new Error("Markdown export requires an array of rows.");
  }

  let resolvedColumns = Array.isArray(columns) && columns.length > 0 ? columns : null;
  if (!resolvedColumns) {
    const seen = new Set();
    for (const row of rows) {
      if (row && typeof row === "object") {
        for (const key of Object.keys(row)) seen.add(key);
      }
    }
    resolvedColumns = Array.from(seen);
  }
  if (resolvedColumns.length === 0) {
    throw new Error("Markdown export needs at least one column.");
  }

  const escape = (value) =>
    String(value ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ");

  const header = `| ${resolvedColumns.join(" | ")} |`;
  const divider = `| ${resolvedColumns.map(() => "---").join(" | ")} |`;
  const lines = [header, divider];
  for (const row of rows) {
    const cells = resolvedColumns.map((column) =>
      escape(row && typeof row === "object" ? row[column] : "")
    );
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

async function exportMarkdown({ window, payload }) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const columns = Array.isArray(payload?.columns) ? payload.columns : null;
  const title = String(payload?.title ?? "C-Quant export");
  const intro = payload?.intro ? `\n${String(payload.intro)}\n` : "";
  const generatedAt = `_Generated ${new Date().toISOString()} by C-Quant_`;
  const defaultName = String(payload?.defaultName ?? "c-quant-export.md").slice(0, 200);

  const body =
    rows.length > 0
      ? rowsToMarkdown(rows, columns)
      : "_(no rows in this export)_";

  const content = `# ${title}\n${intro}\n${body}\n\n${generatedAt}\n`;

  return writeFileWithDialog({
    window,
    defaultName,
    content,
    filters: [
      { name: "Markdown", extensions: ["md", "markdown"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
}

async function exportPdf({ window, payload }) {
  if (!window) {
    throw new Error("Cannot export PDF without an active window.");
  }
  const defaultName = String(payload?.defaultName ?? "c-quant-export.pdf").slice(0, 200);
  const pdfOptions = {
    printBackground: true,
    landscape: !!payload?.landscape,
    pageSize: payload?.pageSize || "A4",
    preferCSSPageSize: true
  };

  const data = await window.webContents.printToPDF(pdfOptions);

  const result = await dialog.showSaveDialog(window, {
    defaultPath: defaultName,
    filters: [
      { name: "PDF document", extensions: ["pdf"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  await fs.mkdir(path.dirname(result.filePath), { recursive: true });
  await fs.writeFile(result.filePath, data);
  return { canceled: false, filePath: result.filePath };
}

module.exports = {
  rowsToCsv,
  rowsToMarkdown,
  quoteCsvCell,
  exportCsv,
  exportPdf,
  exportMarkdown
};
