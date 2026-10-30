function normalizeReceiptMoney(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const asNumber = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (Number.isFinite(asNumber)) {
    return asNumber;
  }
  return 0;
}

export default function resolveReceiptItemAmount(item) {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const finalAmount = normalizeReceiptMoney(item.final_item_amount);
  if (finalAmount) {
    return finalAmount;
  }

  const unitPrice = normalizeReceiptMoney(item.base_amount);
  const quantity = normalizeReceiptMoney(item.quantity || 1);
  if (unitPrice) {
    return unitPrice * (quantity || 1);
  }

  return 0;
}