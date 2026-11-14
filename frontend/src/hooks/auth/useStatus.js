import { useContext } from "react";
import StatusContext from "../../context/StatusContext";

export default function useStatus() {
  const context = useContext(StatusContext);

  if (!context) {
    throw new Error("useStatus must be used within StatusProvider");
  }

  return context;
}