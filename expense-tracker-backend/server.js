import express from "express";
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/expenses", expenseRoutes);

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
