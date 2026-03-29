import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";

const app = express();
const prisma = new PrismaClient();

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501", "http://127.0.0.1:4173", "http://localhost:4173", "http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

// ✅ Handle ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../apps/frontend")));
app.use("/data", express.static(path.join(__dirname, "../src/data")));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/index.html"));
});

app.get("/auth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/auth.html"));
});

app.get("/expenses.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/expenses.html"));
});

app.get("/analytics.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/analytics.html"));
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
    const mlResponse = await fetch('http://127.0.0.1:5001/api/train-model', {
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
    const mlResponse = await fetch("http://127.0.0.1:5001/api/predict-category", {
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
  res.sendFile(path.join(__dirname, "../apps/frontend/screen/index.html"));
});

// ✅ Start server
app.listen(5000, () => console.log(`✅ Server running at http://localhost:5000`));
