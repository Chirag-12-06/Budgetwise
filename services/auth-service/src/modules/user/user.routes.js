import express from "express";

import { getProfile, updateProfile } from "./user.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import { updateProfileSchema } from "./user.validation.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  updateProfile,
);

export { router };
