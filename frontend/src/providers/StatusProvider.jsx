import StatusContext from "../context/StatusContext";
import useStatusMessage from "../hooks/auth/useStatusMessage";

export default function StatusProvider({ children }) {
  const statusData = useStatusMessage();

  return (
    <StatusContext.Provider value={statusData}>
      {children}
    </StatusContext.Provider>
  );
}