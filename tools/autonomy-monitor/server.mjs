import http from "node:http";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const port = Number(process.env.CQUANT_AUTONOMY_MONITOR_PORT || "4781");

const paths = {
  control: path.join(repoRoot, ".autonomy", "control.json"),
  backlog: path.join(repoRoot, ".autonomy", "backlog.json"),
  baseState: path.join(repoRoot, ".autonomy", "base-state.json"),
  eventsDir: path.join(repoRoot, ".autonomy", "events"),
  latestCycle: path.join(repoRoot, ".autonomy", "latest-cycle.md"),
  runsDir: path.join(repoRoot, ".autonomy", "runs"),
  autonomyState: path.join(repoRoot, "docs", "autonomy-state.md"),
  controlScript: path.join(repoRoot, "scripts", "autonomy-control.ps1"),
  index: path.join(__dirname, "index.html")
};

const CONTROL_ACTIONS = new Set(["start", "resume", "pause", "stop", "idle"]);

function withTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function listRecentRuns() {
  if (!existsSync(paths.runsDir)) {
    return [];
  }

  const entries = await fs.readdir(paths.runsDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .map(async (entry) => {
        const fullPath = path.join(paths.runsDir, entry.name);
        const stat = await fs.stat(fullPath);
        const content = await readText(fullPath);
        const preview = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 8);

        return {
          name: entry.name,
          updatedAt: stat.mtime.toISOString(),
          size: stat.size,
          preview,
          content
        };
      })
  );

  return files.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 8);
}

async function listRecentEvents() {
  if (!existsSync(paths.eventsDir)) {
    return [];
  }

  const entries = await fs.readdir(paths.eventsDir, { withFileTypes: true });
  const events = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
      .map(async (entry) => {
        const fullPath = path.join(paths.eventsDir, entry.name);
        try {
          const raw = await fs.readFile(fullPath, "utf8");
          const parsed = JSON.parse(raw);
          return {
            name: entry.name,
            ...parsed
          };
        } catch {
          return null;
        }
      })
  );

  return events
    .filter(Boolean)
    .sort((left, right) => (right.index ?? 0) - (left.index ?? 0))
    .slice(0, 12);
}

function extractLatestSnapshot(markdown) {
  const start = "<!-- AUTONOMY:LAST-RUN:START -->";
  const end = "<!-- AUTONOMY:LAST-RUN:END -->";
  const startIndex = markdown.indexOf(start);
  const endIndex = markdown.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return [];
  }

  return markdown
    .slice(startIndex + start.length, endIndex)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function deriveExecution(control) {
  if (!control) {
    return {
      state: "missing",
      label: "State missing",
      detail: "The control file could not be read."
    };
  }

  if (control.mode !== "running") {
    return {
      state: control.mode,
      label: control.mode,
      detail: "Autonomous mode is not armed for the next cycle."
    };
  }

  if (control.lease?.owner) {
    return {
      state: "active",
      label: "active cycle",
      detail: `A cycle is currently leased by ${control.lease.owner}.`
    };
  }

  return {
    state: "armed",
    label: "armed / waiting",
    detail: "Autonomous mode is running, but there is no active lease. A scheduler or manual trigger must start the next cycle."
  };
}

function deriveScheduler(control) {
  if (!control || control.mode !== "running") {
    return {
      connected: false,
      label: "inactive",
      detail: "The loop is not in running mode."
    };
  }

  if (control.lease?.owner) {
    return {
      connected: true,
      label: "cycle active",
      detail: "A cycle is currently executing."
    };
  }

  return {
    connected: false,
    label: "manual trigger only",
    detail: "No background scheduler heartbeat is visible from the control state."
  };
}

function summarizeBacklog(backlog) {
  const tasks = Array.isArray(backlog?.tasks) ? backlog.tasks : [];
  const open = tasks.filter((task) => task.status !== "done");
  const current = tasks.find((task) => task.id === backlog?.active_task_id) ?? null;
  return {
    openTasks: open,
    currentTask:
      tasks.find((task) => task.id === backlog?.active_task_id) ??
      open.find((task) => task.status === "in_progress") ??
      open[0] ??
      null
  };
}

async function buildSnapshot() {
  const [control, backlog, baseState, autonomyState, latestCycle, recentRuns, recentEvents] = await Promise.all([
    readJson(paths.control),
    readJson(paths.backlog),
    readJson(paths.baseState),
    readText(paths.autonomyState),
    readText(paths.latestCycle),
    listRecentRuns(),
    listRecentEvents()
  ]);

  const tasks = Array.isArray(backlog?.tasks) ? backlog.tasks : [];
  const openTasks = tasks.filter((task) => task.status !== "done");
  const currentTask =
    tasks.find((task) => task.id === control?.active_task_id) ??
    openTasks.find((task) => task.status === "in_progress") ??
    openTasks[0] ??
    null;

  return {
    generatedAt: new Date().toISOString(),
    repoRoot,
    control,
    baseState,
    execution: deriveExecution(control),
    scheduler: deriveScheduler(control),
    stuckDetection: control?.stuck_detection ?? baseState?.stuck_detection ?? null,
    budget: control?.budget ?? baseState?.budget ?? null,
    currentTask,
    openTasks,
    latestSnapshot: extractLatestSnapshot(autonomyState),
    latestCycle,
    recentEvents,
    recentRuns: recentRuns.map((run) => ({
      name: run.name,
      updatedAt: run.updatedAt,
      size: run.size,
      preview: run.preview
    }))
  };
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function runControlAction(action, payload) {
  const args = ["-ExecutionPolicy", "Bypass", "-File", paths.controlScript, "-Action", action];

  if (payload?.reason) {
    args.push("-Reason", String(payload.reason));
  }
  if (payload?.resumeCommand) {
    args.push("-ResumeCommand", String(payload.resumeCommand));
  }
  if (payload?.sessionName) {
    args.push("-SessionName", String(payload.sessionName));
  }
  if (payload?.noStopOnUserReturn) {
    args.push("-NoStopOnUserReturn");
  }

  await execFileAsync("powershell", args, { cwd: repoRoot });
}

function writeJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value, null, 2));
}

function writeText(response, statusCode, value, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(withTrailingNewline(value));
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `127.0.0.1:${port}`}`);

    if (request.method === "GET" && url.pathname === "/api/status") {
      writeJson(response, 200, await buildSnapshot());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/control") {
      const rawBody = await readRequestBody(request);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const action = String(payload.action || "");

      if (!CONTROL_ACTIONS.has(action)) {
        writeJson(response, 400, {
          error: "Invalid action",
          allowedActions: Array.from(CONTROL_ACTIONS)
        });
        return;
      }

      await runControlAction(action, payload);
      writeJson(response, 200, await buildSnapshot());
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/runs/")) {
      const name = decodeURIComponent(url.pathname.replace("/api/runs/", ""));
      const safeName = path.basename(name);
      const fullPath = path.join(paths.runsDir, safeName);
      if (!existsSync(fullPath)) {
        writeJson(response, 404, { error: "Run log not found" });
        return;
      }

      writeJson(response, 200, {
        name: safeName,
        content: await readText(fullPath)
      });
      return;
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      writeText(response, 200, await readText(paths.index), "text/html; charset=utf-8");
      return;
    }

    writeJson(response, 404, { error: "Not found" });
  } catch (error) {
    writeJson(response, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `Autonomy monitor running at http://127.0.0.1:${port}\n`
  );
});
