import { useEffect } from "react";

export default function useDropdownClose({
  dropdownref,
  isOpen,
  onClose,
}) {

  useEffect(() => {

    if (!isOpen) {
      return;
    }

    function handleClickOnOutside(event) {
      if (dropdownref.current && !dropdownref.current.contains(event.target)) {
        onClose();
      }
    }

    function handleOnEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOnOutside);
    document.addEventListener("keydown", handleOnEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOnOutside);
      document.removeEventListener("keydown", handleOnEscapeKey);
    };

  }, [isOpen, dropdownref, onClose]);
}