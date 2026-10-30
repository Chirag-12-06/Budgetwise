// Authentication routes
import express from "express";
import { signup, login, getProfile, updateProfile, logout, forgotPassword, resetPassword } from "./auth.controller.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();


router.post("/signup", signup);

router.post("/login", login);

router.get("/profile", requireAuth, getProfile);

router.patch("/profile", requireAuth, updateProfile);

router.post("/logout", requireAuth, logout);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);


export default router;
