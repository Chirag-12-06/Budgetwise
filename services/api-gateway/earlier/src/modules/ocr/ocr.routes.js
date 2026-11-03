import { Router } from "express";
import { processReceiptController} from "./receipt.controller.js";

const router = Router();

router.post("/process-receipt", processReceiptController);

export default router;