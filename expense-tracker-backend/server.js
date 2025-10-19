import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'DELETE') {
    console.log(`[req] ${req.method} ${req.url} body=`, req.body);
  } else {
    console.log(`[req] ${req.method} ${req.url}`);
  }
  next();
});

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve test.html from backend root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

// Use the router for API endpoints
app.use("/api/expenses", expenseRoutes);

// Temporary debug endpoint to inspect incoming request bodies from the browser
app.post('/debug/echo', (req, res) => {
  // return the parsed body and headers so we can see exactly what the browser sent
  res.json({ body: req.body, headers: req.headers });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

// Error handler to log unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Server error' });
});
