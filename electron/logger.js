"use strict";

/**
 * File-rotating logger for the Electron main process.
 *
 * - Writes to <userData>/logs/cquant.log
 * - Rotates when the active file exceeds MAX_LOG_BYTES.
 * - Keeps MAX_KEEP rotated files.
 * - All operations are best-effort: a failing log call must never crash
 *   the main process.
 */

const fs = require("node:fs");
const path = require("node:path");

const MAX_LOG_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_KEEP = 4;

let activeLogger = null;

function nowIso() {
  return new Date().toISOString();
}

function safeStringify(value) {
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function rotate(logPath) {
  try {
    for (let i = MAX_KEEP - 1; i >= 0; i -= 1) {
      const src = i === 0 ? logPath : `${logPath}.${i}`;
      const dst = `${logPath}.${i + 1}`;
      try {
        fs.renameSync(src, dst);
      } catch {
        // skip missing files
      }
    }
  } catch {
    // rotation is best-effort
  }
}

function writeLine(logPath, level, args) {
  const line = `[${nowIso()}] [${level}] ${args.map(safeStringify).join(" ")}\n`;

  try {
    if (logPath) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });

      try {
        const stat = fs.statSync(logPath);
        if (stat.size > MAX_LOG_BYTES) {
          rotate(logPath);
        }
      } catch {
        // file may not exist yet
      }

      fs.appendFileSync(logPath, line, "utf8");
    }
  } catch {
    // ignore — never throw from logger
  }

  // Also mirror to stderr for non-INFO levels so console transcripts capture them.
  if (level !== "info" && level !== "debug") {
    try {
      process.stderr.write(line);
    } catch {
      // ignore
    }
  }
}

function createLogger({ logDir = "" } = {}) {
  const logPath = logDir ? path.join(logDir, "cquant.log") : "";
  const isVerbose = process.env.CQUANT_DEBUG === "1" || process.env.NODE_ENV !== "production";

  function debug(...args) {
    if (!isVerbose) return;
    writeLine(logPath, "debug", args);
  }
  function info(...args) {
    writeLine(logPath, "info", args);
  }
  function warn(...args) {
    writeLine(logPath, "warn", args);
  }
  function error(...args) {
    writeLine(logPath, "error", args);
  }

  function flushSync(reason) {
    // appendFileSync is already used per call; this is a marker line so
    // operators reading the log can see when the process shut down.
    if (logPath) {
      try {
        fs.appendFileSync(
          logPath,
          `[${nowIso()}] [info] logger flush on ${reason || "exit"}\n`,
          "utf8"
        );
      } catch {
        // ignore
      }
    }
  }

  return { debug, info, warn, error, flushSync, logPath };
}

/**
 * Wire process-level signals so an exit always leaves a clean tail in
 * the rotating log. Idempotent — calling twice is safe.
 */
let shutdownInstalled = false;
function installShutdownHandlers() {
  if (shutdownInstalled) return;
  shutdownInstalled = true;

  const finish = (signal) => () => {
    try {
      activeLogger?.flushSync?.(signal);
    } catch {
      // ignore
    }
  };

  process.on("exit", finish("exit"));
  process.on("SIGINT", () => {
    finish("SIGINT")();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    finish("SIGTERM")();
    process.exit(143);
  });
}

function setActiveLogger(logger) {
  activeLogger = logger;
}

/**
 * Module-level proxy: callers can `const log = require("./logger")` early,
 * before app userData is available. Once `setActiveLogger` is wired during
 * `app.whenReady`, all calls are routed to the file logger.
 */
const lazy = {
  debug: (...args) => activeLogger?.debug(...args),
  info: (...args) => activeLogger?.info(...args),
  warn: (...args) => activeLogger?.warn(...args),
  error: (...args) => activeLogger?.error(...args)
};

module.exports = {
  createLogger,
  setActiveLogger,
  installShutdownHandlers,
  ...lazy,
  MAX_LOG_BYTES,
  MAX_KEEP
};
