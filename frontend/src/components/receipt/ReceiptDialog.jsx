import Button from "../ui/button"; // Adjust import path

export default function ReceiptDialog({
  isOpen,
  receiptBill,
  receiptPaidMap,
  onClose,
  onToggleItem,
  onApply,
  resolveReceiptItemAmount,
}) {
  if (!isOpen) return null;

  const items = Array.isArray(receiptBill?.items)
    ? receiptBill.items
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-scan-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="receipt-scan-dialog-title"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {receiptBill?.restaurant_name || "Receipt"}
        </h3>

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-600">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-slate-700/60 dark:text-slate-200">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit_Price</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Paid</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
              {items.length ? (
                items.map((item, index) => {
                  const amount = resolveReceiptItemAmount(item);
                  const key = String(index);
                  const isPaid = Boolean(receiptPaidMap[key]);

                  return (
                    <tr
                      key={key}
                      className="text-gray-800 dark:text-slate-100"
                    >
                      <td className="px-3 py-2">
                        {item?.name || "(unnamed)"}
                      </td>

                      <td className="px-3 py-2">
                        {item?.quantity ?? ""}
                      </td>

                      <td className="px-3 py-2">
                        {item?.base_amount ?? ""}
                      </td>

                      <td className="px-3 py-2">
                        {amount ? amount.toFixed(2) : ""}
                      </td>

                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(event) =>
                              onToggleItem(index, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500"
                          />

                          <span className="text-sm text-gray-700 dark:text-slate-200">
                            {isPaid ? "Paid" : "Not paid"}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-3 py-4 text-sm text-gray-600 dark:text-slate-200"
                    colSpan={5}
                  >
                    No items detected on this receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="plain"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="plain"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            type="button"
            onClick={onApply}
          >
            Use selection
          </Button>
        </div>
      </div>
    </div>
  );
}