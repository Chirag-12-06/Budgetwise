export default function StatusBanner({ status }) {
  if (!status) {
    return null;
  }

  return (
    <div className={status.type === "error" ? "status error" : "status success"}>
      {status.message}
    </div>
  );
}
