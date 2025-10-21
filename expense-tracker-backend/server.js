import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();

// ✅ Enable CORS for your frontend (Live Server or direct file)
app.use(
  cors({
    credentials: true,
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],

    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
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

// ✅ Fallback to index.html for any unknown route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ✅ Start server
app.listen(5000, () => console.log(`✅ Server running at http://localhost:5000`));
