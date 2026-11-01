import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import errorMiddleware from "../../middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Expenses Service running on port ${PORT}`);
});