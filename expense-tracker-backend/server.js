import express from "express";
import expenseRoutes from "./routes/expenseRoutes.js";
const app = express();
app.use(express.json());
app.use("/api/expenses", expenseRoutes);

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

// Add a new expense
app.post('/api/expenses', (req, res) => {
  const { title, amount, category, date } = req.body;

  // Basic validation
  if (!title || !amount || !category) {
    return res.status(400).json({ msg: 'Please include title, amount, and category' });
  }

  // Return mock response for now
  res.status(201).json({
    id: Date.now(),
    title,
    amount,
    category,
    date: date || new Date()
  });
});
