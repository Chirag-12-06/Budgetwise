import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "fs";
import { spawn, spawnSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "url";
import { materializeDueRecurringExpensesForAllUsers } from "./modules/expenses/expense.controller.js";
import { logError, logInfo, logWarn } from "./utils/logger.js";

// ✅ Handle ES modules dirname and load server-local env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotenvResult = dotenv.config({ path: path.join(__dirname, ".env") });
if (dotenvResult.error) {
  // Fallback: allow a repo-root .env (useful for dev setups).
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

dotenv.config({
  path: path.join(__dirname, ".env"),
  override: true,
});

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ML_PORT =
  Number(process.env.ML_PORT) > 0 ? Number(process.env.ML_PORT) : 5001;

const PYTHON_EXECUTABLE = String(
  process.env.PYTHON_EXECUTABLE ||
    path.join(__dirname, "../ml-service/.venv/bin/python"),
).trim();
const INTERNAL_ML_RESTART_DELAY_MS =
  Number(process.env.INTERNAL_ML_RESTART_DELAY_MS) > 0
    ? Number(process.env.INTERNAL_ML_RESTART_DELAY_MS)
    : 3000;
const ML_PYTHON_IMPORT_PROBE = "import flask, sklearn, joblib";
let internalMlProcess = null;
let internalMlStarting = false;
let shuttingDown = false;

if (!String(process.env.OPENAI_API_KEY || "").trim()) {
  logWarn(
    "⚠ OPENAI_API_KEY is not set. Receipt scanning (OCR -> extraction) will fail until you add it to server/.env or your environment.",
  );
}

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:5501",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5002",
];

const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = CORS_ORIGINS.length
  ? CORS_ORIGINS
  : DEFAULT_CORS_ORIGINS;

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
const frontendDistPath = path.join(__dirname, "../dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

function sendFrontendIndex(res) {
  if (!existsSync(frontendIndexPath)) {
    res
      .status(404)
      .send(
        "Frontend build not found. Run `npm run build` in repository root.",
      );
    return;
  }

  res.sendFile(frontendIndexPath);
}

function getPythonExecutableCandidates() {
  const localMlVenvPython = path.join(
    __dirname,
    "../ml-service/.venv/bin/python",
  );
  const renderMlVenvPython =
    "/opt/render/project/src/ml-service/.venv/bin/python";

  return Array.from(
    new Set(
      [
        PYTHON_EXECUTABLE,
        localMlVenvPython,
        renderMlVenvPython,
        "python3",
        "python",
      ].filter(Boolean),
    ),
  );
}

function probePythonCandidateForMl(candidate, workingDir) {
  const probe = spawnSync(candidate, ["-c", ML_PYTHON_IMPORT_PROBE], {
    cwd: workingDir,
    env: process.env,
    encoding: "utf8",
  });

  if (probe.error?.code === "ENOENT") {
    return {
      ok: false,
      reason: "executable not found",
      missingExecutable: true,
    };
  }

  if (probe.status === 0) {
    return { ok: true };
  }

  const output = String(`${probe.stderr || ""}\n${probe.stdout || ""}`.trim());
  const missingModuleMatch = output.match(/No module named ['"]([^'"]+)['"]/);

  if (missingModuleMatch) {
    return {
      ok: false,
      reason: `missing Python package '${missingModuleMatch[1]}'`,
    };
  }

  return {
    ok: false,
    reason: output || `dependency probe failed with exit code ${probe.status}`,
  };
}

function isInternalMlProcessRunning() {
  return Boolean(
    internalMlProcess &&
    internalMlProcess.exitCode === null &&
    !internalMlProcess.killed,
  );
}

function ensureInternalMlService(trigger = "runtime") {
  if (shuttingDown) {
    return;
  }

  if (isInternalMlProcessRunning() || internalMlStarting) {
    return;
  }

  logWarn(
    `⚠ Internal ML process not running during ${trigger}. Attempting restart.`,
  );
  startInternalMlService();
}

function startInternalMlService() {
  if (internalMlStarting || isInternalMlProcessRunning()) {
    return;
  }

  internalMlStarting = true;

  const mlScriptPath = path.join(__dirname, "../ml-service/app.py");
  const mlWorkingDir = path.join(__dirname, "../ml-service");

  if (!existsSync(mlScriptPath)) {
    logError(`❌ Internal ML script not found at ${mlScriptPath}`);
    internalMlStarting = false;
    return;
  }

  if (
    (PYTHON_EXECUTABLE.includes("/") || PYTHON_EXECUTABLE.includes("\\")) &&
    !existsSync(PYTHON_EXECUTABLE)
  ) {
    logWarn(
      `⚠ Configured PYTHON_EXECUTABLE not found: ${PYTHON_EXECUTABLE}. ` +
        "Will try fallback executables.",
    );
  }

  const pythonCandidates = getPythonExecutableCandidates();
  const spawnOptions = {
    cwd: mlWorkingDir,
    env: {
      ...process.env,
      ML_PORT: String(ML_PORT),
      FLASK_DEBUG: process.env.FLASK_DEBUG || "0",
    },
    stdio: "inherit",
  };

  function launchWithCandidate(index) {
    if (index >= pythonCandidates.length) {
      internalMlStarting = false;
      internalMlProcess = null;
      logError(
        "❌ Unable to start internal ML service: no usable Python executable found.",
      );
      logError(
        "ℹ Ensure Render build command installs ML dependencies before start.",
      );
      return;
    }

    const candidate = pythonCandidates[index];
    const probeResult = probePythonCandidateForMl(candidate, mlWorkingDir);

    if (!probeResult.ok) {
      if (index < pythonCandidates.length - 1) {
        const nextCandidate = pythonCandidates[index + 1];
        logWarn(
          `⚠ Skipping Python candidate ${candidate}: ${probeResult.reason}. Trying ${nextCandidate}.`,
        );
        launchWithCandidate(index + 1);
        return;
      }

      internalMlStarting = false;
      internalMlProcess = null;
      logError(
        `❌ Unable to start internal ML service with ${candidate}: ${probeResult.reason}.`,
      );
      logError(
        "ℹ Install Python dependencies for the runtime interpreter (for example `python3 -m pip install -r ml-service/requirements.txt`).",
      );
      return;
    }

    logInfo(
      `🤖 Starting internal ML service using ${candidate} on port ${ML_PORT}`,
    );
    const child = spawn(candidate, [mlScriptPath], spawnOptions);
    let fallbackTriggered = false;

    child.on("spawn", () => {
      internalMlProcess = child;
      internalMlStarting = false;
      logInfo(`✅ Internal ML process started (pid ${child.pid})`);
    });

    child.on("error", (error) => {
      if (error?.code === "ENOENT" && index < pythonCandidates.length - 1) {
        fallbackTriggered = true;
        const nextCandidate = pythonCandidates[index + 1];
        logWarn(
          `⚠ Python executable not found: ${candidate}. Retrying with ${nextCandidate}.`,
        );
        launchWithCandidate(index + 1);
        return;
      }

      internalMlStarting = false;
      internalMlProcess = null;
      logError("❌ Failed to launch internal ML service:", error);
      logError(
        "ℹ Ensure Render build command installs ML dependencies before start.",
      );
    });

    child.on("exit", (code, signal) => {
      if (fallbackTriggered) {
        return;
      }

      if (internalMlProcess === child) {
        internalMlProcess = null;
      }
      internalMlStarting = false;
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      logError(`❌ Internal ML service stopped (${reason})`);

      if (!shuttingDown) {
        setTimeout(
          () => ensureInternalMlService("ml process exit"),
          INTERNAL_ML_RESTART_DELAY_MS,
        );
      }
    });
  }

  launchWithCandidate(0);
}

function stopInternalMlService(trigger) {
  shuttingDown = true;

  if (!internalMlProcess || internalMlProcess.killed) {
    return;
  }

  logInfo(`🛑 Stopping internal ML service (${trigger})`);
  internalMlProcess.kill("SIGTERM");
}

process.on("SIGTERM", () => {
  stopInternalMlService("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  stopInternalMlService("SIGINT");
  process.exit(0);
});

process.on("exit", () => {
  stopInternalMlService("process exit");
});

// async function getFetch() {
//   if (!fetchPromise) {
//     fetchPromise = import("node-fetch").then((module) => module.default);
//   }

//   return fetchPromise;
// }

// async function parseResponseBody(response) {
//   const text = await response.text();

//   if (!text) {
//     return { text: "", json: null };
//   }

//   try {
//     return { text, json: JSON.parse(text) };
//   } catch {
//     return { text, json: null };
//   }
// }

// async function fetchWithTimeout(fetchFn, url, options, timeoutMs) {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

//   try {
//     return await fetchFn(url, {
//       ...options,
//       signal: controller.signal,
//     });
//   } finally {
//     clearTimeout(timeoutId);
//   }
// }

app.use(express.json({ limit: "10mb" }));
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}
app.use("/data", express.static(path.join(__dirname, "../src/data")));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get(
  ["/", "/index.html", "/auth.html", "/expenses.html", "/analytics.html"],
  (_req, res) => {
    sendFrontendIndex(res);
  },
);


app.post("/api/test-route", (_req, res) => {
  res.json({ ok: true });
});

logInfo(
  "✅ API routes registered: /api/expenses, /api/recurring-expenses, /api/auth, /api/train-model, /api/predict-category, /api/ml-health",
);




// ✅ Fallback to index.html for any unknown route
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  sendFrontendIndex(res);
});

// ✅ Start server
startInternalMlService();

let recurringMaterializerRunning = false;
const RECURRING_MATERIALIZER_INTERVAL_MS =
  Number(process.env.RECURRING_MATERIALIZER_INTERVAL_MS) > 0
    ? Number(process.env.RECURRING_MATERIALIZER_INTERVAL_MS)
    : 10_000;

async function runRecurringMaterializer(trigger) {
  if (recurringMaterializerRunning || shuttingDown) {
    return;
  }

  recurringMaterializerRunning = true;
  try {
    await materializeDueRecurringExpensesForAllUsers();
  } catch (error) {
    logError(`❌ Recurring materializer failed during ${trigger}:`, error);
  } finally {
    recurringMaterializerRunning = false;
  }
}

app.listen(PORT, () => {
  logInfo(`✅ Server running at http://127.0.0.1:${PORT}`);
  runRecurringMaterializer("startup");
  setInterval(
    () => runRecurringMaterializer("interval"),
    RECURRING_MATERIALIZER_INTERVAL_MS,
  );
});
