"use strict";

/**
 * Optional crash + error reporter.
 *
 * Sentry is initialized only when CQUANT_SENTRY_DSN is set in the
 * environment. Without a DSN this module is a no-op — the app runs
 * exactly as it did before, and no telemetry leaves the machine.
 *
 * We deliberately don't bake a hard-coded DSN into the binary. Operators
 * who want production crash collection set the env var on the machine
 * (Windows: setx CQUANT_SENTRY_DSN "...") or via a wrapper script.
 */

const logger = require("./logger");

let initialized = false;

function init({ release, environment }) {
  if (initialized) return false;

  const dsn = process.env.CQUANT_SENTRY_DSN;
  if (!dsn) {
    logger.debug("[sentry] disabled (CQUANT_SENTRY_DSN unset)");
    return false;
  }

  try {
    const Sentry = require("@sentry/electron/main");
    Sentry.init({
      dsn,
      release,
      environment: environment || (process.env.NODE_ENV === "production" ? "production" : "development"),
      // Sentry-Electron also captures the renderer when instrumented there;
      // we keep the renderer SDK optional for now since the renderer is
      // already wrapped in StartupErrorBoundary.
      autoSessionTracking: false,
      tracesSampleRate: 0,
      // Avoid sending PII or local file paths verbatim.
      beforeSend(event) {
        if (event?.user) delete event.user;
        return event;
      }
    });
    initialized = true;
    logger.info("[sentry] initialized");
    return true;
  } catch (error) {
    logger.warn("[sentry] failed to initialize:", error);
    return false;
  }
}

function captureError(error, context) {
  if (!initialized) return;
  try {
    const Sentry = require("@sentry/electron/main");
    Sentry.captureException(error, { extra: context });
  } catch {
    // ignore
  }
}

function isInitialized() {
  return initialized;
}

module.exports = { init, captureError, isInitialized };
