import express from "express";

import {
  getPreferences,
  updateUserPreferences,
} from "./preference.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import { updatePreferenceSchema } from "./preference.validation.js";

const router = express.Router();

router.get("/", authMiddleware, getPreferences);

router.put(
  "/",
  authMiddleware,
  validate(updatePreferenceSchema),
  updateUserPreferences,
);

export { router };
