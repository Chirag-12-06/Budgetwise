// User authentication and management routes
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();

const PASSWORD_SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  return secret || null;
}

function buildAuthToken(userId) {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  return jwt.sign({}, secret, {
    subject: String(userId),
    expiresIn: JWT_EXPIRES_IN,
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
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    console.error('Login error:', error);
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
    console.error('Get profile error:', error);
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
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req, res) => {
  // JWT auth is stateless; client logout clears local token/session.
  res.json({ message: 'Logout successful' });
};
