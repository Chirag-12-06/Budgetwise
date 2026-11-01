import express from "express";
import { getCategories } from "./category.controller.js";

const router = express.Router();

router.get("/", getCategories);

export { router };
