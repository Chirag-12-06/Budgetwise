import express from "express";

import { router as preferencesRoutes } from "../modules/preference/preference.routes.js";
import { router as authRoutes } from "../modules/auth/auth.routes.js";
import { router as userRoutes } from "../modules/user/user.routes.js";

const router = express.Router();

router.use("/preferences", preferencesRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
