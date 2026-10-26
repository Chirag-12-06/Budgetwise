// Authentication routes
import express from "express";
import { signup, login, getProfile, updateProfile, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

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
router.get("/profile", requireAuth, getProfile);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 */
router.patch("/profile", requireAuth, updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 */
router.post("/logout", requireAuth, logout);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);
export default router;
