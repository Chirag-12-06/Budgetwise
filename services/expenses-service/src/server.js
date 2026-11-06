import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import prisma from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      service: "expenses-service",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: "expenses-service",
      database: "disconnected",
    });
  }
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Expenses Service running on port ${PORT}`);
});