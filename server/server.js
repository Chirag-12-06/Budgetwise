import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "url";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";

// ✅ Handle ES modules dirname and load server-local env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

function isLoopbackServiceUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;
const ML_PORT = Number(process.env.ML_PORT) > 0 ? Number(process.env.ML_PORT) : 5001;
const INTERNAL_ML_URL = `http://127.0.0.1:${ML_PORT}`;
const PYTHON_EXECUTABLE = String(process.env.PYTHON_EXECUTABLE || "python3").trim();
const ML_SERVICE_URL = String(
  process.env.ML_SERVICE_URL || INTERNAL_ML_URL,
).replace(/\/$/, "");
const START_INTERNAL_ML_RAW = String(process.env.START_INTERNAL_ML || "").trim().toLowerCase();
const START_INTERNAL_ML_ENABLED = START_INTERNAL_ML_RAW === "1" || START_INTERNAL_ML_RAW === "true";
const START_INTERNAL_ML_DISABLED = START_INTERNAL_ML_RAW === "0" || START_INTERNAL_ML_RAW === "false";
const SHOULD_START_INTERNAL_ML = !START_INTERNAL_ML_DISABLED
  && (START_INTERNAL_ML_ENABLED || isLoopbackServiceUrl(ML_SERVICE_URL));
const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_REQUEST_TIMEOUT_MS) > 0
  ? Number(process.env.ML_REQUEST_TIMEOUT_MS)
  : 20000;
const ML_MAX_RETRIES = Number(process.env.ML_MAX_RETRIES) >= 0
  ? Number(process.env.ML_MAX_RETRIES)
  : 2;
const ML_RETRY_BASE_DELAY_MS = Number(process.env.ML_RETRY_BASE_DELAY_MS) > 0
  ? Number(process.env.ML_RETRY_BASE_DELAY_MS)
  : 800;
const ML_RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
let fetchPromise;
let internalMlProcess = null;

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

function startInternalMlService() {
  if (!SHOULD_START_INTERNAL_ML) {
    return;
  }

  const mlScriptPath = path.join(__dirname, "../ml-service/app.py");
  const mlWorkingDir = path.join(__dirname, "../ml-service");

  if (!existsSync(mlScriptPath)) {
    console.error(`❌ Internal ML script not found at ${mlScriptPath}`);
    return;
  }

  if (!isLoopbackServiceUrl(ML_SERVICE_URL)) {
    console.warn(
      `⚠ Internal ML is enabled but ML_SERVICE_URL is ${ML_SERVICE_URL}. `
      + `Use a loopback URL (for example ${INTERNAL_ML_URL}) for same-service mode.`,
    );
  }

  console.log(`🤖 Starting internal ML service using ${PYTHON_EXECUTABLE} on port ${ML_PORT}`);
  internalMlProcess = spawn(PYTHON_EXECUTABLE, [mlScriptPath], {
    cwd: mlWorkingDir,
    env: {
      ...process.env,
      ML_PORT: String(ML_PORT),
      FLASK_DEBUG: process.env.FLASK_DEBUG || "0",
    },
    stdio: "inherit",
  });

  internalMlProcess.on("error", (error) => {
    console.error("❌ Failed to launch internal ML service:", error);
  });

  internalMlProcess.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`❌ Internal ML service stopped (${reason})`);
  });
}

function stopInternalMlService(trigger) {
  if (!internalMlProcess || internalMlProcess.killed) {
    return;
  }

  console.log(`🛑 Stopping internal ML service (${trigger})`);
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
  const fetchFn = await getFetch();
  const url = `${ML_SERVICE_URL}${pathname}`;

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
app.use("/api/auth", authRoutes);

// ✅ ML training endpoint
app.post("/api/train-model", requireAuth, async (req, res) => {
  try {
    console.log('📥 Training request received');
    const userId = String(req.user.id);
    
    // Fetch authenticated user's expenses from database directly
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });

    console.log(`📊 Found ${expenses.length} expenses for authenticated user: ${userId}`);
    
    if (expenses.length < 10) {
      return res.status(400).json({ 
        error: 'Need at least 10 expenses to train the model',
        current: expenses.length 
      });
    }
    
    // Send to ML service for training
    console.log('🚀 Sending to ML service...');
    const result = await callMlService("/api/train-model", {
      method: "POST",
      body: {
        expenses,
        user_id: userId,
      },
    });
    console.log('✅ Training completed:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Training error:', error);
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
    console.error("❌ Prediction error:", error);

    // Keep expense flow usable even when ML service is unstable.
    res.json({
      category: "uncategorized",
      confidence: 0,
      fallback: true,
      message: "ML service temporarily unavailable",
    });
  }
});

app.get("/api/ml-model-status", requireAuth, async (req, res) => {
  try {
    const userId = encodeURIComponent(String(req.user.id));
    const result = await callMlService(`/api/model-status?user_id=${userId}`);
    res.json(result);
  } catch (error) {
    console.error("❌ ML model status error:", error);
    const status = Number(error?.status || 503);
    res.status(status >= 400 && status < 600 ? status : 503).json({ error: error.message });
  }
});

app.get("/api/ml-health", async (_req, res) => {
  try {
    const result = await callMlService("/health");
    res.json(result);
  } catch (error) {
    console.error("❌ ML health check error:", error);
    const status = Number(error?.status || 503);
    res.status(status >= 400 && status < 600 ? status : 503).json({ error: error.message });
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
app.listen(PORT, () => console.log(`✅ Server running at http://127.0.0.1:${PORT}`));
