import express from "express";

import { register, login, logout, forgotPassword } from "./auth.controller.js";

import validate from "../../middleware/validate.middleware.js";

import { registerSchema, loginSchema, forgotPasswordSchema } from "./auth.validation.js";

const router = express.Router();

// router.post("/register", validate(registerSchema), register);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

export { router };
