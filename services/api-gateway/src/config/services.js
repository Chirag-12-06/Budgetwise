const services = {
  auth: process.env.AUTH_SERVICE_URL,
  expenses: process.env.EXPENSES_SERVICE_URL,
  ocr: process.env.OCR_SERVICE_URL,
  prediction: process.env.PREDICTION_SERVICE_URL,
};

export default services;