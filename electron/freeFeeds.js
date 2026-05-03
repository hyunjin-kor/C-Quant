/**
 * Free, public-data feed adapters.
 *
 * These adapters target genuinely free, well-documented public APIs and
 * dashboards. Where an API key is needed (FRED), the env var is optional
 * and missing-key behaviour is honest: the adapter returns a structured
 * "not-configured" status instead of fabricating data.
 *
 * Feeds covered:
 *   - FRED (Federal Reserve Bank of St. Louis) — open API; key issued
 *     free at https://fredaccount.stlouisfed.org/login/secure/.
 *   - ECB SDW (European Central Bank Statistical Data Warehouse) — open
 *     CSV/JSON downloads, no key required.
 *   - ICAP Allowance Price Explorer — public dashboard with downloadable
 *     CSV. The adapter exposes the public dashboard URL; in-app fetch is
 *     intentionally left to the operator because ICAP rate-limits scrapers.
 *   - World Bank Carbon Pricing Dashboard — public dashboard URL.
 *
 * Each adapter exposes:
 *   id, provider, status(), and either a fetchSeries() or a documented
 *   download URL.
 */

const DEFAULT_TIMEOUT_MS = 8000;

function readEnv(key) {
  const value = process.env[key];
  if (!value || typeof value !== "string") return "";
  return value.trim();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function createFredAdapter() {
  return {
    id: "fred",
    provider: "FRED (Federal Reserve Bank of St. Louis)",
    async status() {
      const apiKey = readEnv("CQUANT_FRED_API_KEY");
      if (!apiKey) {
        return {
          status: "not-configured",
          provider: "FRED (Federal Reserve Bank of St. Louis)",
          message:
            "FRED data is free but requires a personal API key. Set CQUANT_FRED_API_KEY after registering at fredaccount.stlouisfed.org.",
          docUrl: "https://fredaccount.stlouisfed.org/login/secure/"
        };
      }
      return {
        status: "ready",
        provider: "FRED (Federal Reserve Bank of St. Louis)",
        message: "FRED API key detected. Series can be fetched on demand.",
        docUrl: "https://fred.stlouisfed.org/docs/api/fred/"
      };
    },
    /**
     * Fetch a FRED time series. Returns null on any error or when the API
     * is not configured. The shape is intentionally narrow — date+value
     * tuples, sorted ascending — so it composes with the event-study
     * helpers without requiring a wider DTO.
     */
    async fetchSeries(seriesId, opts = {}) {
      const apiKey = readEnv("CQUANT_FRED_API_KEY");
      if (!apiKey) return null;
      const params = new URLSearchParams({
        series_id: seriesId,
        api_key: apiKey,
        file_type: "json"
      });
      if (opts.observationStart) params.set("observation_start", opts.observationStart);
      if (opts.observationEnd) params.set("observation_end", opts.observationEnd);
      const url = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
      try {
        const response = await fetchWithTimeout(url, { timeoutMs: opts.timeoutMs });
        if (!response.ok) return null;
        const json = await response.json();
        if (!json || !Array.isArray(json.observations)) return null;
        return json.observations
          .filter((row) => row && typeof row.date === "string" && typeof row.value === "string")
          .map((row) => ({ date: row.date, value: parseFloat(row.value) }))
          .filter((row) => Number.isFinite(row.value));
      } catch {
        return null;
      }
    }
  };
}

function createEcbSdwAdapter() {
  return {
    id: "ecb-sdw",
    provider: "ECB Statistical Data Warehouse",
    async status() {
      return {
        status: "ready",
        provider: "ECB Statistical Data Warehouse",
        message:
          "ECB SDW provides public CSV/JSON downloads with no key. Series fetched directly from data-api.ecb.europa.eu.",
        docUrl: "https://data.ecb.europa.eu/help/api/overview"
      };
    },
    /**
     * Fetch a CSV-shaped time series from the ECB SDW data API. The
     * response is parsed defensively because ECB occasionally returns
     * partial CSVs around revision dates.
     */
    async fetchSeries(seriesKey, opts = {}) {
      const url = `https://data-api.ecb.europa.eu/service/data/${encodeURI(seriesKey)}?format=csvdata`;
      try {
        const response = await fetchWithTimeout(url, { timeoutMs: opts.timeoutMs });
        if (!response.ok) return null;
        const text = await response.text();
        if (!text) return null;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) return null;
        const header = lines.shift().split(",");
        const dateIdx = header.findIndex((cell) => /TIME_PERIOD/i.test(cell));
        const valueIdx = header.findIndex((cell) => /OBS_VALUE/i.test(cell));
        if (dateIdx < 0 || valueIdx < 0) return null;
        const out = [];
        for (const line of lines) {
          const cells = line.split(",");
          if (cells.length <= Math.max(dateIdx, valueIdx)) continue;
          const date = cells[dateIdx];
          const value = parseFloat(cells[valueIdx]);
          if (date && Number.isFinite(value)) {
            out.push({ date, value });
          }
        }
        return out;
      } catch {
        return null;
      }
    }
  };
}

function createIcapAdapter() {
  return {
    id: "icap-allowance-price-explorer",
    provider: "ICAP Allowance Price Explorer",
    async status() {
      return {
        status: "ready",
        provider: "ICAP Allowance Price Explorer",
        message:
          "ICAP publishes a free comparison dashboard for compliance allowance prices across multiple ETSs. Programmatic fetch is left to the operator to respect ICAP rate limits.",
        docUrl: "https://icapcarbonaction.com/en/ets-prices"
      };
    },
    /**
     * ICAP exposes a downloadable comparison CSV behind their dashboard.
     * The adapter does not auto-scrape; it returns the documented entry
     * URL so the operator can ingest the data through the desktop UI.
     */
    async getDownloadUrl() {
      return "https://icapcarbonaction.com/en/ets-prices";
    }
  };
}

function createWorldBankCarbonAdapter() {
  return {
    id: "world-bank-carbon-pricing-dashboard",
    provider: "World Bank Carbon Pricing Dashboard",
    async status() {
      return {
        status: "ready",
        provider: "World Bank Carbon Pricing Dashboard",
        message:
          "World Bank publishes annual State and Trends of Carbon Pricing snapshots. Use as a long-horizon cross-jurisdiction reference, not as live price.",
        docUrl: "https://www.worldbank.org/en/programs/pricing-carbon"
      };
    },
    async getDashboardUrl() {
      return "https://carbonpricingdashboard.worldbank.org/";
    }
  };
}

const FREE_ADAPTER_FACTORIES = [
  createFredAdapter,
  createEcbSdwAdapter,
  createIcapAdapter,
  createWorldBankCarbonAdapter
];

function createFreeFeedRegistry() {
  const adapters = FREE_ADAPTER_FACTORIES.map((factory) => factory());
  return {
    list() {
      return adapters.map((adapter) => ({ id: adapter.id, provider: adapter.provider }));
    },
    async getStatuses() {
      const out = [];
      for (const adapter of adapters) {
        try {
          const status = await adapter.status();
          out.push(status);
        } catch (error) {
          out.push({
            status: "error",
            provider: adapter.provider,
            message: error && error.message ? String(error.message) : "Unknown adapter error"
          });
        }
      }
      return out;
    },
    async fetchSeries(adapterId, seriesId, opts = {}) {
      const adapter = adapters.find((item) => item.id === adapterId);
      if (!adapter || typeof adapter.fetchSeries !== "function") return null;
      try {
        return await adapter.fetchSeries(seriesId, opts);
      } catch {
        return null;
      }
    }
  };
}

module.exports = {
  createFreeFeedRegistry,
  createFredAdapter,
  createEcbSdwAdapter,
  createIcapAdapter,
  createWorldBankCarbonAdapter
};
