import { useEffect } from "react";

export default function useDropdownClose({
  ref,
  isOpen,
  onClose,
}) {

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };

  }, [isOpen, ref, onClose]);
}