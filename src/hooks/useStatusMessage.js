import { useState, useEffect } from "react";

export default function useStatusMessage() {
  const [status, setStatus] = useState(null);

  function showStatus(message, type) {
    setStatus({ message, type });
  }

  function clearStatus() {
    setStatus(null);
  }

  useEffect(() => {
    if (!status) return;

    const timeoutId = setTimeout(() => {
      clearStatus();
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [status]);


  return {
    status,
    clearStatus,
    showStatus,
  };
}