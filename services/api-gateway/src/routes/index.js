import express from "express";
import services from "../config/services.js";
import createServiceProxy from "../utils/createServiceProxy.js";
import protectedRoute from "../utils/protectedRoute.js";

const router = express.Router();

// Public auth routes
router.use("/auth", createServiceProxy(services.auth, "/auth"));

// Protected auth routes
router.use("/users", ...protectedRoute(services.auth, "/users"));
router.use("/preferences", ...protectedRoute(services.auth, "/preferences"));

// Protected expenses routes
router.use("/categories", ...protectedRoute(services.expenses, "/categories"));
router.use("/groups", ...protectedRoute(services.expenses, "/groups"));
router.use(
  "/transactions",
  ...protectedRoute(services.expenses, "/transactions"),
);
router.use("/budgets", ...protectedRoute(services.expenses, "/budgets"));

// Protected OCR routes
router.use(
  "/process-receipt",
  ...protectedRoute(services.ocr, "/process-receipt"),
);

// Protected prediction routes
router.use("/", ...protectedRoute(services.prediction, ""));



export default router;
