import express from "express";
import { getCategoryGroups } from "./group.controller.js";

const router = express.Router();

router.get("/", getCategoryGroups);

export { router };
