// Authentication routes
import express from "express";
import { signup, login, getProfile, updateProfile, logout } from "../controllers/authController.js";

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
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 */
router.patch("/profile", updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 */
router.post("/logout", logout);

export default router;
