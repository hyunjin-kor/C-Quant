/**
 * Korean number formatting helpers (만 / 억 / 조 단위).
 *
 * Used when locale === "ko" to render KRW / CNY values the way Korean
 * speakers actually read them. English / international locales keep
 * the standard western grouping.
 *
 *   formatKoreanNumber(9_520_000)            // "952만"
 *   formatKoreanNumber(125_000_000)          // "1.25억"
 *   formatKoreanNumber(125_000_000, { currency: "KRW" })  // "₩1.25억"
 *   formatKoreanNumber(78.42)                // "78.42"   (passes through)
 *   formatKoreanNumber(-9_520_000)           // "-952만"
 */

const MAN = 10_000;
const EOK = 100_000_000;
const JO = 1_000_000_000_000;

const CURRENCY_PREFIX: Record<string, string> = {
  KRW: "₩",
  CNY: "¥",
  EUR: "€",
  USD: "$",
  JPY: "¥"
};

type FormatOptions = {
  currency?: string;
  // Precision for the fractional part of 만 / 억 / 조 unit display.
  // Defaults to 2 (e.g. 1.25억). Set to 0 for clean integer display.
  precision?: number;
  // Always emit the unit suffix even for values < 10,000 (default false).
  forceUnit?: boolean;
};

function trimTrailingZeros(formatted: string): string {
  // "1.20" → "1.2", "1.00" → "1", "1.25" → "1.25"
  if (!formatted.includes(".")) return formatted;
  return formatted.replace(/\.?0+$/, "");
}

function applyPrecision(value: number, precision: number): string {
  if (!Number.isFinite(value)) return String(value);
  const fixed = value.toFixed(Math.max(0, Math.min(8, precision)));
  return trimTrailingZeros(fixed);
}

function pickPrefix(currency?: string): string {
  if (!currency) return "";
  const key = currency.toUpperCase();
  return CURRENCY_PREFIX[key] ?? "";
}

export function formatKoreanNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return String(value);

  const { currency, precision = 2, forceUnit = false } = options;
  const prefix = pickPrefix(currency);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  let body: string;

  if (abs >= JO) {
    body = `${applyPrecision(abs / JO, precision)}조`;
  } else if (abs >= EOK) {
    body = `${applyPrecision(abs / EOK, precision)}억`;
  } else if (abs >= MAN) {
    body = `${applyPrecision(abs / MAN, precision)}만`;
  } else if (forceUnit && abs > 0) {
    body = applyPrecision(abs, precision);
  } else {
    // Standard comma-grouped formatting for sub-만 values.
    body = new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: precision
    }).format(abs);
  }

  return `${prefix}${sign}${body}`;
}

/**
 * Choose between the Korean unit-aware formatter and the western locale
 * formatter based on the active app locale.
 */
export function formatLocalizedNumber(
  value: number,
  locale: "ko" | "en",
  options: FormatOptions = {}
): string {
  if (locale === "ko") {
    return formatKoreanNumber(value, options);
  }
  if (!Number.isFinite(value)) return String(value);
  const prefix = pickPrefix(options.currency);
  return `${prefix}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: options.precision ?? 2
  }).format(value)}`;
}
