// User authentication and management routes
import { PrismaClient } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { invalidateAuthSession } from "../middleware/authMiddleware.js";
import { logError } from "../utils/logger.js";

const PASSWORD_SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const loginAttemptStore = new Map();

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const LOGIN_MAX_ATTEMPTS = Math.floor(parsePositiveNumber(process.env.LOGIN_MAX_ATTEMPTS, 5));
const LOGIN_LOCK_MINUTES = parsePositiveNumber(process.env.LOGIN_LOCK_MINUTES, 15);
const LOGIN_LOCK_WINDOW_MS = LOGIN_LOCK_MINUTES * 60 * 1000;

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  return secret || null;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return String(req.ip || req.socket?.remoteAddress || "unknown").trim();
}

function getLoginAttemptKey(req, email) {
  return `${String(email || "").toLowerCase()}::${getClientIp(req)}`;
}

function getActiveAttemptEntry(attemptKey, now = Date.now()) {
  const existing = loginAttemptStore.get(attemptKey);
  if (!existing) {
    return null;
  }

  if (now > existing.windowEndsAt) {
    loginAttemptStore.delete(attemptKey);
    return null;
  }

  return existing;
}

function getRetryAfterSeconds(entry, now = Date.now()) {
  if (!entry) {
    return 0;
  }

  return Math.max(1, Math.ceil((entry.windowEndsAt - now) / 1000));
}

function registerFailedLogin(attemptKey, now = Date.now()) {
  const existing = getActiveAttemptEntry(attemptKey, now);
  const next = existing
    ? {
      count: existing.count + 1,
      windowEndsAt: existing.windowEndsAt,
    }
    : {
      count: 1,
      windowEndsAt: now + LOGIN_LOCK_WINDOW_MS,
    };

  loginAttemptStore.set(attemptKey, next);
  return next;
}

function clearFailedLogins(attemptKey) {
  loginAttemptStore.delete(attemptKey);
}

function handleFailedLogin(res, attemptKey) {
  const failedEntry = registerFailedLogin(attemptKey);
  if (failedEntry.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfterSeconds = getRetryAfterSeconds(failedEntry);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: `Too many login attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
      retryAfterSeconds,
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
}

function buildAuthToken(userId) {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  return jwt.sign({}, secret, {
    subject: String(userId),
    expiresIn: JWT_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export const signup = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const avatarDataUrl = req.body?.avatarDataUrl;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    // Create user in DB. ID is assigned by database automatically.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatarDataUrl: avatarDataUrl ? String(avatarDataUrl) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarDataUrl: true,
        createdAt: true
      }
    });

    const token = buildAuthToken(user.id);
    if (!token) {
      return res.status(500).json({ message: 'Server auth is not configured' });
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    logError('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const attemptKey = getLoginAttemptKey(req, email);

    const activeAttempts = getActiveAttemptEntry(attemptKey);
    if (activeAttempts && activeAttempts.count >= LOGIN_MAX_ATTEMPTS) {
      const retryAfterSeconds = getRetryAfterSeconds(activeAttempts);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message: `Too many login attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
        retryAfterSeconds,
      });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return handleFailedLogin(res, attemptKey);
    }

    let validPassword = false;
    if (user.password?.startsWith("$2")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      // Backward compatibility for legacy plain-text rows: migrate on successful login.
      validPassword = user.password === password;
      if (validPassword) {
        const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!validPassword) {
      return handleFailedLogin(res, attemptKey);
    }

    clearFailedLogins(attemptKey);

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarDataUrl: user.avatarDataUrl,
      createdAt: user.createdAt
    };

    const token = buildAuthToken(user.id);
    if (!token) {
      return res.status(500).json({ message: 'Server auth is not configured' });
    }
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logError('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarDataUrl: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logError('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const hasAvatarDataUrl = Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarDataUrl');
    const avatarDataUrl = hasAvatarDataUrl
      ? String(req.body?.avatarDataUrl || '').trim()
      : undefined;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({ where: { email } });
      if (emailInUse && emailInUse.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        ...(hasAvatarDataUrl ? { avatarDataUrl: avatarDataUrl || null } : {}),
      },
      select: { id: true, name: true, email: true, avatarDataUrl: true, createdAt: true }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    logError('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req, res) => {
  // JWT auth is stateless; client logout clears local token/session.
  if (req.authSessionId) {
    invalidateAuthSession(req.authSessionId);
  }

  res.json({ message: 'Logout successful' });
};
