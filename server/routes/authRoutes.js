// Authentication routes
import express from "express";
import { signup, login, getProfile, logout } from "../controllers/authController.js";

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 */
router.post("/signup", signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 */
router.get("/profile", getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 */
router.post("/logout", logout);

export default router;
