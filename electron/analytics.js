"use strict";

/**
 * Privacy-first analytics dispatcher.
 *
 * Two flags must align before a single byte leaves the machine:
 *
 *   1. The user has opted in (settings.analyticsEnabled === true)
 *   2. CQUANT_ANALYTICS_ENDPOINT is set to a Plausible-style endpoint
 *
 * If either is missing, every track() call is a no-op. We deliberately
 * do not bake a hard-coded endpoint into the binary so anyone shipping
 * C-Quant has to make an explicit choice about their analytics provider.
 *
 * Event schema:
 *   {
 *     name: string,            // e.g. "surface.changed"
 *     timestamp: ISO-8601,
 *     properties?: Record<string, string | number | boolean>,
 *     app: { version, platform, locale }
 *   }
 *
 * No PII, IPs, or user identifiers are added by this module. The endpoint
 * receives only what the caller passes in `properties`.
 */

const logger = require("./logger");

const MAX_QUEUED = 64;

let optedIn = false;
let endpoint = "";
let appContext = {};
const queue = [];

function init({ enabled, app }) {
  optedIn = !!enabled;
  endpoint = String(process.env.CQUANT_ANALYTICS_ENDPOINT || "").trim();
  appContext = { ...(app || {}) };
  logger.debug("[analytics]", { optedIn, endpointConfigured: Boolean(endpoint) });
  // Flush queued events only when both flags align — otherwise we'd silently
  // drop or worse, fire to an unconfigured endpoint.
  if (isReady()) {
    while (queue.length) {
      const event = queue.shift();
      if (event) void deliver(event);
    }
  }
}

// Test-only helper. Lives behind a name unlikely to be confused with a
// public API; used by vitest to reset module-level state between specs.
function __resetForTests() {
  optedIn = false;
  endpoint = "";
  appContext = {};
  queue.length = 0;
}

function setEnabled(value) {
  optedIn = !!value;
}

function isReady() {
  return optedIn && Boolean(endpoint);
}

function track(name, properties) {
  if (!name || typeof name !== "string") return;

  const event = {
    name: name.slice(0, 80),
    timestamp: new Date().toISOString(),
    properties: sanitizeProperties(properties),
    app: { ...appContext }
  };

  if (!isReady()) {
    if (queue.length < MAX_QUEUED) queue.push(event);
    return;
  }
  void deliver(event);
}

function sanitizeProperties(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof key !== "string" || key.length > 64) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
  }
  return out;
}

async function deliver(event) {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event)
    });
  } catch (error) {
    logger.debug("[analytics] dispatch failed:", error);
  }
}

module.exports = { init, setEnabled, isReady, track, sanitizeProperties, __resetForTests };
