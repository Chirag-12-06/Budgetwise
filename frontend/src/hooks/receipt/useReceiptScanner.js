import { useRef, useState } from "react";
import { processReceipt } from "../../api/receipt.api";

export default function useReceiptScanner({ setExpenseForm }) {
  const fileInputRef = useRef(null);

  const [receiptBill, setReceiptBill] = useState(null);
  const [receiptPaidMap, setReceiptPaidMap] = useState({});
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const [scanError, setScanError] = useState("");
  const [scanErrorOpen, setScanErrorOpen] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  const handleReceiptScan = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsScanning(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const json = await processReceipt(dataUrl, file.name);

      if (json?.error) {
        throw new Error(json.error);
      }

      const bill = json?.data?.bills?.[0] ?? null;
      const items = Array.isArray(bill?.items) ? bill.items : [];

      const paidMap = {};

      items.forEach((_, index) => {
        paidMap[String(index)] = true;
      });

      setReceiptBill(bill);
      setReceiptPaidMap(paidMap);
      setReceiptDialogOpen(true);
    } catch (error) {
      console.error("Receipt upload failed:", error);

      setScanError(
        error.message || "Receipt processing failed. Please try again.",
      );
      setScanErrorOpen(true);
    } finally {
      setIsScanning(false);
      event.target.value = "";
    }
  };

  const toggleReceiptItem = (index, checked) => {
    const key = String(index);

    setReceiptPaidMap((current) => ({
      ...current,
      [key]: checked,
    }));
  };

  const getSelectedReceiptTotal = (resolveReceiptItemAmount) => {
    const items = Array.isArray(receiptBill?.items)
      ? receiptBill.items
      : [];

    return items.reduce((sum, item, index) => {
      if (!receiptPaidMap[String(index)]) return sum;

      return sum + resolveReceiptItemAmount(item);
    }, 0);
  };

  const applyReceiptSelection = (resolveReceiptItemAmount) => {
    const selectedTotal = getSelectedReceiptTotal(
      resolveReceiptItemAmount,
    );

    const restaurantName = receiptBill?.restaurant_name || "";

    setExpenseForm((current) => ({
      ...current,
      title: restaurantName || current.title,
      amount: selectedTotal
        ? selectedTotal.toFixed(2)
        : current.amount,
    }));

    setReceiptDialogOpen(false);
  };

  return {
    fileInputRef,

    receiptBill,
    receiptPaidMap,
    receiptDialogOpen,
    setReceiptDialogOpen,

    scanError,
    scanErrorOpen,
    setScanErrorOpen,

    isScanning,

    handleReceiptScan,
    toggleReceiptItem,
    getSelectedReceiptTotal,
    applyReceiptSelection,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(
      new Error("Failed to read the selected image."),
    );

    reader.readAsDataURL(file);
  });
}