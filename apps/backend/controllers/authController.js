// User authentication and management routes
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    // Create user in DB. ID is assigned by database automatically.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password // In production, use bcrypt.hash(password, 10)
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user,
      token: String(user.id) // In production, use JWT
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: String(user.id) // In production, use JWT
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const userId = Number(token);
    
    if (!token || Number.isNaN(userId)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true }
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

export const logout = async (req, res) => {
  // In production with JWT, you might want to invalidate the token
  res.json({ message: 'Logout successful' });
};
