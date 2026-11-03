const OCR_SERVICE_URL = (
  process.env.OCR_SERVICE_URL || "http://127.0.0.1:5002"
).replace(/\/+$/, "");

export async function processReceiptService(payload) {
  const response = await fetch(
    `${OCR_SERVICE_URL}/api/process-receipt`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.error || "Receipt processing failed",
    );

    error.status = response.status;
    throw error;
  }

  return result;
}