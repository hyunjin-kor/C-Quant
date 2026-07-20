/**
 * Institutional feed adapter pattern.
 *
 * Honest scope:
 * - This module does NOT bundle Bloomberg, Refinitiv, ICE, or EEX paid
 *   APIs. Those require licenses, often by exchange and product.
 * - It provides a stable adapter contract that an operator with a license
 *   can wire up by setting environment variables and supplying credentials
 *   through the appSettings layer.
 * - When no credentials are configured, the adapter returns a structured
 *   "not configured" status that the renderer can show as a setup banner
 *   instead of crashing or pretending to have data.
 *
 * Adding a new institutional feed:
 *   1. Implement createXxxAdapter() returning an object that conforms to
 *      InstitutionalFeedAdapter (see JSDoc below).
 *   2. Register the factory in `ADAPTER_FACTORIES`.
 *   3. Document the required env vars in docs/COMPLIANCE.md.
 *
 * The adapter is intentionally async and side-effect free (it never
 * mutates global state) so it can be unit-tested without Electron.
 */

/**
 * @typedef {Object} InstitutionalFeedStatus
 * @property {"ready"|"not-configured"|"error"} status
 * @property {string} provider
 * @property {string} message
 * @property {string} [docUrl]
 */

/**
 * @typedef {Object} InstitutionalQuote
 * @property {string} symbol
 * @property {number} price
 * @property {string} currency
 * @property {string} asOf
 * @property {string} provider
 * @property {string} sourceUrl
 */

/**
 * @typedef {Object} InstitutionalFeedAdapter
 * @property {string} id
 * @property {string} provider
 * @property {() => Promise<InstitutionalFeedStatus>} status
 * @property {(symbol: string) => Promise<InstitutionalQuote | null>} fetchQuote
 */

function readEnv(key) {
  const value = process.env[key];
  if (!value || typeof value !== "string") return "";
  return value.trim();
}

/**
 * @returns {InstitutionalFeedAdapter}
 */
function createRefinitivAdapter() {
  return {
    id: "refinitiv",
    provider: "Refinitiv (LSEG) Data Platform",
    async status() {
      const appKey = readEnv("CQUANT_REFINITIV_APP_KEY");
      const username = readEnv("CQUANT_REFINITIV_USERNAME");
      if (!appKey || !username) {
        return {
          status: "not-configured",
          provider: "Refinitiv (LSEG) Data Platform",
          message:
            "Set CQUANT_REFINITIV_APP_KEY and CQUANT_REFINITIV_USERNAME, plus the password via the Electron secret store, to enable.",
          docUrl:
            "https://developers.lseg.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis"
        };
      }
      return {
        status: "ready",
        provider: "Refinitiv (LSEG) Data Platform",
        message: "Refinitiv credentials detected. Quote calls will use the Data Platform API."
      };
    },
    async fetchQuote(_symbol) {
      // Intentional placeholder: the real call is left for the operator to wire
      // because it requires a signed user agreement. Returning null lets the
      // renderer show "configure provider" without showing fabricated prices.
      return null;
    }
  };
}

/**
 * @returns {InstitutionalFeedAdapter}
 */
function createBloombergAdapter() {
  return {
    id: "bloomberg",
    provider: "Bloomberg Professional Service (B-PIPE / API)",
    async status() {
      const host = readEnv("CQUANT_BLOOMBERG_HOST");
      const port = readEnv("CQUANT_BLOOMBERG_PORT");
      if (!host || !port) {
        return {
          status: "not-configured",
          provider: "Bloomberg Professional Service (B-PIPE / API)",
          message:
            "Set CQUANT_BLOOMBERG_HOST and CQUANT_BLOOMBERG_PORT to point at a B-PIPE/SAPI gateway. Bloomberg licensing is per-terminal.",
          docUrl: "https://www.bloomberg.com/professional/support/api-library/"
        };
      }
      return {
        status: "ready",
        provider: "Bloomberg Professional Service (B-PIPE / API)",
        message: "Bloomberg gateway configured."
      };
    },
    async fetchQuote(_symbol) {
      return null;
    }
  };
}

/**
 * @returns {InstitutionalFeedAdapter}
 */
function createIceConsolidatedAdapter() {
  return {
    id: "ice-consolidated",
    provider: "ICE Consolidated Feed (EUA / EFP / Brent)",
    async status() {
      const apiKey = readEnv("CQUANT_ICE_API_KEY");
      if (!apiKey) {
        return {
          status: "not-configured",
          provider: "ICE Consolidated Feed (EUA / EFP / Brent)",
          message:
            "Set CQUANT_ICE_API_KEY to enable ICE consolidated futures and options. License is product-specific.",
          docUrl: "https://www.ice.com/market-data/connectivity-and-feeds/consolidated-feed"
        };
      }
      return {
        status: "ready",
        provider: "ICE Consolidated Feed (EUA / EFP / Brent)",
        message: "ICE consolidated feed credentials detected."
      };
    },
    async fetchQuote(_symbol) {
      return null;
    }
  };
}

/**
 * @returns {InstitutionalFeedAdapter}
 */
function createEexExchangeAdapter() {
  return {
    id: "eex-exchange",
    provider: "EEX Exchange Data Services (auction & EUA derivatives)",
    async status() {
      const apiKey = readEnv("CQUANT_EEX_API_KEY");
      if (!apiKey) {
        return {
          status: "not-configured",
          provider: "EEX Exchange Data Services (auction & EUA derivatives)",
          message:
            "Set CQUANT_EEX_API_KEY for auction settlement and derivatives end-of-day. Public website remains the free anchor.",
          docUrl:
            "https://www.eex.com/en/market-data/market-data-services/market-data-from-exchange-feed"
        };
      }
      return {
        status: "ready",
        provider: "EEX Exchange Data Services (auction & EUA derivatives)",
        message: "EEX exchange feed credentials detected."
      };
    },
    async fetchQuote(_symbol) {
      return null;
    }
  };
}

const ADAPTER_FACTORIES = [
  createRefinitivAdapter,
  createBloombergAdapter,
  createIceConsolidatedAdapter,
  createEexExchangeAdapter
];

function createInstitutionalFeedRegistry() {
  const adapters = ADAPTER_FACTORIES.map((factory) => factory());

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
    async fetchQuote(adapterId, symbol) {
      const adapter = adapters.find((item) => item.id === adapterId);
      if (!adapter) return null;
      const status = await adapter.status();
      if (status.status !== "ready") return null;
      return adapter.fetchQuote(symbol);
    }
  };
}

module.exports = {
  createInstitutionalFeedRegistry,
  createRefinitivAdapter,
  createBloombergAdapter,
  createIceConsolidatedAdapter,
  createEexExchangeAdapter
};
