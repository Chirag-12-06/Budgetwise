import { processReceiptService } from "./receipt.service.js";

export async function processReceiptController(req, res) {
  try {
    const result = await processReceiptService(req.body || {});
    return res.json(result);
  } catch (error) {
    console.error("OCR processing error:", error);

    return res.status(error.status || 503).json({
      error: "OCR service is temporarily unavailable.",
    });
  }
}