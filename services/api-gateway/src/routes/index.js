import express from "express";
import services from "../config/services.js";
import createServiceProxy from "../utils/createServiceProxy.js";

const router = express.Router();

// Auth service
router.use("/auth", createServiceProxy(services.auth, "/auth"));
router.use("/users", createServiceProxy(services.auth, "/users"));
router.use("/preferences", createServiceProxy(services.auth, "/preferences"));

// Expenses service
router.use("/categories", createServiceProxy(services.expenses, "/categories"));
router.use("/groups", createServiceProxy(services.expenses, "/groups"));
router.use("/transactions", createServiceProxy(services.expenses, "/transactions"));
router.use("/budgets", createServiceProxy(services.expenses, "/budgets"));

export default router;