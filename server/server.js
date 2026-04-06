import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";

// ✅ Handle ES modules dirname and load server-local env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;
const ML_SERVICE_URL = String(process.env.ML_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");

const DEFAULT_CORS_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_CORS_ORIGINS;

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const frontendDistPath = path.join(__dirname, "../dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

function sendFrontendIndex(res) {
  if (!existsSync(frontendIndexPath)) {
    res.status(404).send("Frontend build not found. Run `npm run build` in repository root.");
    return;
  }

  res.sendFile(frontendIndexPath);
}

app.use(express.json({ limit: "10mb" }));
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}
app.use("/data", express.static(path.join(__dirname, "../src/data")));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get(["/", "/index.html", "/auth.html", "/expenses.html", "/analytics.html"], (_req, res) => {
  sendFrontendIndex(res);
});


// ✅ API routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);

// ✅ ML training endpoint
app.post("/api/train-model", requireAuth, async (req, res) => {
  try {
    console.log('📥 Training request received');
    const fetch = (await import('node-fetch')).default;
    const userId = String(req.user.id);
    
    // Fetch authenticated user's expenses from database directly
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });

    console.log(`📊 Found ${expenses.length} expenses for authenticated user: ${userId}`);
    
    if (expenses.length < 10) {
      return res.status(400).json({ 
        error: 'Need at least 10 expenses to train the model',
        current: expenses.length 
      });
    }
    
    // Send to ML service for training
    console.log('🚀 Sending to ML service...');
    const mlResponse = await fetch(`${ML_SERVICE_URL}/api/train-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        expenses,
        user_id: userId
      })
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      throw new Error(`ML service error: ${errorText}`);
    }
    
    const result = await mlResponse.json();
    console.log('✅ Training completed:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Training error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ML prediction endpoint
app.post("/api/predict-category", requireAuth, async (req, res) => {
  try {
    const { title = "", amount = 0 } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const fetch = (await import("node-fetch")).default;
    const mlResponse = await fetch(`${ML_SERVICE_URL}/api/predict-category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(title).trim(),
        amount: Number(amount) || 0,
        user_id: String(req.user.id),
      }),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      throw new Error(`ML service error: ${errorText}`);
    }

    const result = await mlResponse.json();
    res.json(result);
  } catch (error) {
    console.error("❌ Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fallback to index.html for any unknown route
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }

  sendFrontendIndex(res);
});

// ✅ Start server
app.listen(PORT, () => console.log(`✅ Server running at http://127.0.0.1:${PORT}`));
