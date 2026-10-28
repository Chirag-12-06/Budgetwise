import api from "./api";

export async function processReceipt(imageB64, filename) {
  return api.post("/process-receipt", {
    image_b64: imageB64,
    filename,
  });
}
