import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

// ✅ Handle ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.urlencoded({ extended: true }));


// ✅ API routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);

// ✅ ML training endpoint
app.post("/api/train-model", async (req, res) => {
  try {
    console.log('📥 Training request received');
    const fetch = (await import('node-fetch')).default;
    const { user_id } = req.body;
    
    // Fetch all expenses from database
    const expensesResponse = await fetch('http://localhost:5000/api/expenses');
    
    if (!expensesResponse.ok) {
      throw new Error('Failed to fetch expenses from database');
    }
    
    const expenses = await expensesResponse.json();
    console.log(`📊 Found ${expenses.length} expenses for user: ${user_id || 'default'}`);
    
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
        user_id: user_id || 'default'
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

// ✅ Fallback to index.html for any unknown route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ✅ Start server
app.listen(5000, () => console.log(`✅ Server running at http://localhost:5000`));
