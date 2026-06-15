  import { useState, useEffect } from "react";

  export default function useStatusMessage({ user, view, addExpenseView }) {
  
  const [status, setStatus] = useState(null);

  function showStatus(message, type) {
    setStatus({ message, type });
  }

  useEffect(() => {
    if (!status) {
      return undefined;
    }

    if (user && view !== addExpenseView) {
      setStatus(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, user, view, addExpenseView]);

  return {
    status,
    setStatus,
    showStatus,
  };
}