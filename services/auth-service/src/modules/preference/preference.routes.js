import express from "express";

import {
  getPreferences,
  updateUserPreferences,
} from "./preference.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getPreferences);
router.put("/", authMiddleware, updateUserPreferences);

export { router };