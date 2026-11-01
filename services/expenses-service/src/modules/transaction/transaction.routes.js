import express from "express";

import {
  createTransactionController,
  getAllTransactionsController,
  getByCategoryTransactionController,
  getByGroupTransactionController,
  getByIdTransactionController,
  updateTransactionController,
  removeTransactionController,
} from "./transaction.controller.js";

const router = express.Router();

router.post("/", createTransactionController);

router.get("/", getAllTransactionsController);
router.get("/category/:categoryId", getByCategoryTransactionController);
router.get("/group/:groupId", getByGroupTransactionController);
router.get("/:id", getByIdTransactionController);

router.put("/:id", updateTransactionController);
router.delete("/:id", removeTransactionController);

export { router };