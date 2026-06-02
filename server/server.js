import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import expenseRoutes from "./routes/expenseRoutes.js";
import recurringExpenseRoutes from "./routes/recurringExpenseRoutes.js";
import { addRecurringExpense } from "./controllers/recurringExpenseController.js";
import { materializeDueRecurringExpensesForAllUsers } from "./controllers/expenseController.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";
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
  override: true
});
console.log(process.env.OPENAI_API_KEY);

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;
const ML_PORT = Number(process.env.ML_PORT) > 0 ? Number(process.env.ML_PORT) : 5001;
const INTERNAL_ML_URL = `http://127.0.0.1:${ML_PORT}`;
const PYTHON_EXECUTABLE = String(
  process.env.PYTHON_EXECUTABLE || path.join(__dirname, "../ml-service/.venv/bin/python"),
).trim();
const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_REQUEST_TIMEOUT_MS) > 0
  ? Number(process.env.ML_REQUEST_TIMEOUT_MS)
  : 20000;
const ML_MAX_RETRIES = Number(process.env.ML_MAX_RETRIES) >= 0
  ? Number(process.env.ML_MAX_RETRIES)
  : 2;
const ML_RETRY_BASE_DELAY_MS = Number(process.env.ML_RETRY_BASE_DELAY_MS) > 0
  ? Number(process.env.ML_RETRY_BASE_DELAY_MS)
  : 800;
const INTERNAL_ML_RESTART_DELAY_MS = Number(process.env.INTERNAL_ML_RESTART_DELAY_MS) > 0
  ? Number(process.env.INTERNAL_ML_RESTART_DELAY_MS)
  : 3000;
const ML_RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const ML_PYTHON_IMPORT_PROBE = "import flask, sklearn, joblib";
let fetchPromise;
let internalMlProcess = null;
let internalMlStarting = false;
let shuttingDown = false;

if (!String(process.env.OPENAI_API_KEY || "").trim()) {
  logWarn(
    "⚠ OPENAI_API_KEY is not set. Receipt scanning (OCR -> extraction) will fail until you add it to server/.env or your environment.",
  );
}

const DEFAULT_CORS_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_CORS_ORIGINS;

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const frontendDistPath = path.join(__dirname, "../dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

function sendFrontendIndex(res) {
  if (!existsSync(frontendIndexPath)) {
    res.status(404).send("Frontend build not found. Run `npm run build` in repository root.");
    return;
  }

  res.sendFile(frontendIndexPath);
}

function getPythonExecutableCandidates() {
  const localMlVenvPython = path.join(__dirname, "../ml-service/.venv/bin/python");
  const renderMlVenvPython = "/opt/render/project/src/ml-service/.venv/bin/python";

  return Array.from(new Set([
    PYTHON_EXECUTABLE,
    localMlVenvPython,
    renderMlVenvPython,
    "python3",
    "python",
  ].filter(Boolean)));
}

function probePythonCandidateForMl(candidate, workingDir) {
  const probe = spawnSync(
    candidate,
    ["-c", ML_PYTHON_IMPORT_PROBE],
    {
      cwd: workingDir,
      env: process.env,
      encoding: "utf8",
    },
  );

  if (probe.error?.code === "ENOENT") {
    return { ok: false, reason: "executable not found", missingExecutable: true };
  }

  if (probe.status === 0) {
    return { ok: true };
  }

  const output = String(`${probe.stderr || ""}\n${probe.stdout || ""}`.trim());
  const missingModuleMatch = output.match(/No module named ['"]([^'"]+)['"]/);

  if (missingModuleMatch) {
    return { ok: false, reason: `missing Python package '${missingModuleMatch[1]}'` };
  }

  return {
    ok: false,
    reason: output || `dependency probe failed with exit code ${probe.status}`,
  };
}

function isInternalMlProcessRunning() {
  return Boolean(internalMlProcess && internalMlProcess.exitCode === null && !internalMlProcess.killed);
}

function ensureInternalMlService(trigger = "runtime") {
  if (shuttingDown) {
    return;
  }

  if (isInternalMlProcessRunning() || internalMlStarting) {
    return;
  }

  logWarn(`⚠ Internal ML process not running during ${trigger}. Attempting restart.`);
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

  if ((PYTHON_EXECUTABLE.includes("/") || PYTHON_EXECUTABLE.includes("\\")) && !existsSync(PYTHON_EXECUTABLE)) {
    logWarn(
      `⚠ Configured PYTHON_EXECUTABLE not found: ${PYTHON_EXECUTABLE}. `
      + "Will try fallback executables.",
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
      logError("❌ Unable to start internal ML service: no usable Python executable found.");
      logError("ℹ Ensure Render build command installs ML dependencies before start.");
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
      logError(`❌ Unable to start internal ML service with ${candidate}: ${probeResult.reason}.`);
      logError(
        "ℹ Install Python dependencies for the runtime interpreter (for example `python3 -m pip install -r ml-service/requirements.txt`).",
      );
      return;
    }

    logInfo(`🤖 Starting internal ML service using ${candidate} on port ${ML_PORT}`);
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
        logWarn(`⚠ Python executable not found: ${candidate}. Retrying with ${nextCandidate}.`);
        launchWithCandidate(index + 1);
        return;
      }

      internalMlStarting = false;
      internalMlProcess = null;
      logError("❌ Failed to launch internal ML service:", error);
      logError("ℹ Ensure Render build command installs ML dependencies before start.");
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
        setTimeout(() => ensureInternalMlService("ml process exit"), INTERNAL_ML_RESTART_DELAY_MS);
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

async function getFetch() {
  if (!fetchPromise) {
    fetchPromise = import("node-fetch").then((module) => module.default);
  }

  return fetchPromise;
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return { text: "", json: null };
  }

  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function fetchWithTimeout(fetchFn, url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callMlService(pathname, { method = "GET", body } = {}) {
  ensureInternalMlService("ml request");

  const fetchFn = await getFetch();
  const url = `${INTERNAL_ML_URL}${pathname}`;

  for (let attempt = 0; attempt <= ML_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        fetchFn,
        url,
        {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        },
        ML_REQUEST_TIMEOUT_MS,
      );

      const payload = await parseResponseBody(response);

      if (response.ok) {
        return payload.json ?? {};
      }

      const message =
        payload.json?.error
        || payload.json?.message
        || payload.text
        || `HTTP ${response.status}`;

      const retryable = ML_RETRYABLE_STATUSES.has(response.status);
      if (!retryable || attempt >= ML_MAX_RETRIES) {
        const error = new Error(`ML service error (${response.status}): ${message}`);
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      const isNetworkOrTimeout =
        error?.name === "AbortError"
        || /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(String(error?.message || ""));

      if (isNetworkOrTimeout) {
        ensureInternalMlService(`failed call to ${pathname}`);
      }

      if (!isNetworkOrTimeout || attempt >= ML_MAX_RETRIES) {
        throw error;
      }
    }

    const backoff = Math.min(5000, ML_RETRY_BASE_DELAY_MS * (2 ** attempt));
    await delay(backoff);
  }

  throw new Error("ML service request failed after retries");
}

app.use(express.json({ limit: "10mb" }));
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}
app.use("/data", express.static(path.join(__dirname, "../src/data")));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get(["/", "/index.html", "/auth.html", "/expenses.html", "/analytics.html"], (_req, res) => {
  sendFrontendIndex(res);
});


// ✅ API routes
app.use("/api/expenses", expenseRoutes);
app.post("/api/recurring-expenses", requireAuth, addRecurringExpense);
app.use("/api/recurring-expenses", recurringExpenseRoutes);
app.use("/api/auth", authRoutes);

app.post("/api/test-route", (_req, res) => {
  res.json({ ok: true });
});

logInfo(
  "✅ API routes registered: /api/expenses, /api/recurring-expenses, /api/auth, /api/train-model, /api/predict-category, /api/ml-health",
);

// ✅ ML training endpoint
app.post("/api/train-model", requireAuth, async (req, res) => {
  try {
    const userId = String(req.user.id);
    
    // Fetch authenticated user's expenses from database directly
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (expenses.length < 10) {
      return res.status(400).json({ 
        error: 'Need at least 10 expenses to train the model',
        current: expenses.length 
      });
    }

    const result = await callMlService("/api/train-model", {
      method: "POST",
      body: {
        expenses,
        user_id: userId,
      },
    });
    res.json(result);
  } catch (error) {
    logError('❌ Training error:', error);
    const status = Number(error?.status || 503);
    res.status(status >= 400 && status < 600 ? status : 503).json({
      error: "ML training is temporarily unavailable. Please retry in a minute.",
      detail: error.message,
    });
  }
});

// ✅ ML prediction endpoint
app.post("/api/predict-category", requireAuth, async (req, res) => {
  try {
    const { title = "", amount = 0 } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await callMlService("/api/predict-category", {
      method: "POST",
      body: {
        title: String(title).trim(),
        amount: Number(amount) || 0,
        user_id: String(req.user.id),
      },
    });

    res.json(result);
  } catch (error) {
    logError("❌ Prediction error:", error);

    // Keep expense flow usable even when ML service is unstable.
    res.json({
      category: "uncategorized",
      confidence: 0,
      fallback: true,
      message: "ML service temporarily unavailable",
    });
  }
});

app.get("/api/ml-health", async (_req, res) => {
  try {
    const routeSummary = (app.router?.stack || [])
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods || {}),
      }));
    logInfo(`ℹ Route snapshot: ${JSON.stringify(routeSummary)}`);

    const result = await callMlService("/health");
    res.json(result);
  } catch (error) {
    logError("❌ ML health check error:", error);
    const status = Number(error?.status || 503);
    res.status(status >= 400 && status < 600 ? status : 503).json({ error: error.message });
  }
});

// ✅ Proxy endpoint to ML service for receipt processing
app.post("/api/process-receipt", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await callMlService("/api/process-receipt", {
      method: "POST",
      body,
    });
    res.json(result);
  } catch (error) {
    logError("❌ Receipt processing error:", error);
    const status = Number(error?.status || 503);
    res.status(status >= 400 && status < 600 ? status : 503).json({
      error: "ML receipt processing is temporarily unavailable.",
      detail: String(error?.message || error),
    });
  }
});

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
const RECURRING_MATERIALIZER_INTERVAL_MS = Number(process.env.RECURRING_MATERIALIZER_INTERVAL_MS) > 0
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
  setInterval(() => runRecurringMaterializer("interval"), RECURRING_MATERIALIZER_INTERVAL_MS);
});
