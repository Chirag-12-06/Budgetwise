import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        return res.status(200).json({});
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


app.listen(5000, () => console.log(`✅ Server running at http://localhost:${5000}`));

