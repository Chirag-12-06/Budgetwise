import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { logError } from "../utils/logger.js";

const prisma = new PrismaClient();
const sessionLastActivity = new Map();

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_IDLE_MINUTES = parsePositiveNumber(process.env.SESSION_IDLE_MINUTES, 15);
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_MINUTES * 60 * 1000;

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  return secret || null;
}

function getPayloadObject(payload) {
  return typeof payload === "string" ? null : payload;
}

function isSessionInactive({ sessionId, issuedAtSeconds, now }) {
  const lastSeenAt = sessionLastActivity.get(sessionId);
  if (Number.isFinite(lastSeenAt)) {
    return now - lastSeenAt > SESSION_IDLE_TIMEOUT_MS;
  }

  const issuedAtMs = Number.isFinite(issuedAtSeconds) && issuedAtSeconds > 0
    ? issuedAtSeconds * 1000
    : 0;

  if (!issuedAtMs) {
    return false;
  }

  return now - issuedAtMs > SESSION_IDLE_TIMEOUT_MS;
}

function markSessionActive(sessionId, now) {
  sessionLastActivity.set(sessionId, now);
}

export function invalidateAuthSession(sessionId) {
  if (!sessionId) {
    return;
  }

  sessionLastActivity.delete(String(sessionId));
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server auth is not configured" });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (_error) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedPayload = getPayloadObject(payload);
    const subject = decodedPayload?.sub;
    const userId = Number(subject);
    const sessionId = decodedPayload?.jti ? String(decodedPayload.jti) : token;
    const issuedAtSeconds = Number(decodedPayload?.iat || 0);
    const now = Date.now();

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (
      isSessionInactive({
        sessionId,
        issuedAtSeconds,
        now,
      })
    ) {
      sessionLastActivity.delete(sessionId);
      return res.status(401).json({ message: "Session expired due to inactivity. Please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    markSessionActive(sessionId, now);

    req.user = user;
    req.authSessionId = sessionId;
    next();
  } catch (error) {
    logError("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
