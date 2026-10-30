import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, "../logs");
const appLogPath = path.join(logsDir, "app.log");
const errorLogPath = path.join(logsDir, "error.log");

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function formatArg(arg) {
  if (arg instanceof Error) {
    return arg.stack || arg.message || String(arg);
  }

  if (typeof arg === "string") {
    return arg;
  }

  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function writeToLogFile(filePath, level, args) {
  ensureLogsDir();
  const timestamp = new Date().toISOString();
  const message = args.map((arg) => formatArg(arg)).join(" ");
  fs.appendFileSync(filePath, `[${timestamp}] [${level}] ${message}\n`, "utf8");
}

export function logInfo(...args) {
  console.log(...args);
  writeToLogFile(appLogPath, "INFO", args);
}

export function logWarn(...args) {
  console.warn(...args);
  writeToLogFile(appLogPath, "WARN", args);
}

export function logError(...args) {
  console.error(...args);
  writeToLogFile(errorLogPath, "ERROR", args);
}
