"use strict";

const path = require("node:path");
const { fileURLToPath } = require("node:url");

const TRUSTED_DEV_SERVER_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_QUOTE_RANGE_IDS = new Set(["1d", "5d", "1m", "3m", "6m", "1y"]);

const MAX_QUOTE_ID_LENGTH = 64;

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character] || character
  );
}

function isTrustedAppUrl(value, { isDev, rendererEntryPath }) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return false;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "file:") {
      if (isDev) {
        return false;
      }
      return path.resolve(fileURLToPath(parsed)) === rendererEntryPath;
    }

    return TRUSTED_DEV_SERVER_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

function parseUrl(value, label) {
  const candidate = String(value ?? "").trim();

  try {
    return new URL(candidate);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
}

function normalizeExternalUrl(value) {
  const parsed = parseUrl(value, "External URL");
  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("Only http and https links can be opened from C-Quant.");
  }
  return parsed.toString();
}

function sanitizeQuoteHistoryPayload(payload) {
  const quoteId = String(payload?.quoteId ?? "").trim();
  const range = String(payload?.range ?? "3m").trim();

  if (!quoteId) {
    throw new Error("Quote history request is missing a quote id.");
  }

  if (quoteId.length > MAX_QUOTE_ID_LENGTH) {
    throw new Error("Quote history request contains an invalid quote id.");
  }

  if (!/^[a-z0-9-]+$/i.test(quoteId)) {
    throw new Error("Quote history request contains an invalid quote id.");
  }

  if (!ALLOWED_QUOTE_RANGE_IDS.has(range)) {
    throw new Error("Quote history request contains an invalid range id.");
  }

  return { quoteId, range };
}

/**
 * Build the Content-Security-Policy header value used for the renderer.
 *
 * Production: strict (no 'unsafe-inline' for scripts, no dev origins).
 * Development: relaxed enough for Vite HMR (inline scripts, ws:).
 */
function buildContentSecurityPolicy({ isDev }) {
  const productionConnect = [
    "'self'",
    "https://www.eex.com",
    "https://public.eex-group.com",
    "https://ets.krx.co.kr",
    "https://data-dbg.krx.co.kr",
    "https://query1.finance.yahoo.com",
    "https://www.mee.gov.cn",
    "https://overview.cneeex.com"
  ];

  const directives = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "script-src": ["'self'"],
    // 'unsafe-inline' is required for styled-components-style runtime injection
    // and for the inline <style> tag Vite injects in production for some helpers.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [...productionConnect]
  };

  if (isDev) {
    // Vite dev server uses inline scripts and module-script eval for HMR.
    directives["script-src"].push(
      "'unsafe-inline'",
      "'unsafe-eval'",
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    );
    directives["connect-src"].push(
      "http://localhost:5173",
      "ws://localhost:5173",
      "http://127.0.0.1:5173",
      "ws://127.0.0.1:5173"
    );
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");
}

module.exports = {
  TRUSTED_DEV_SERVER_ORIGINS,
  ALLOWED_EXTERNAL_PROTOCOLS,
  ALLOWED_QUOTE_RANGE_IDS,
  MAX_QUOTE_ID_LENGTH,
  escapeHtml,
  isTrustedAppUrl,
  parseUrl,
  normalizeExternalUrl,
  sanitizeQuoteHistoryPayload,
  buildContentSecurityPolicy
};
