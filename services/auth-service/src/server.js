import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import errorMiddleware from "./middleware/error.middleware.js";
import prisma from "./config/db.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      service: "auth-service",
      database: "connected",
    });
  } catch (error) {
    console.error("Auth database health check failed:", error);

    res.status(500).json({
      success: false,
      service: "auth-service",
      database: "disconnected",
    });
  }
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});