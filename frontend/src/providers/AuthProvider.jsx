import AuthContext from "../context/AuthContext";
import useAppController from "../hooks/useAppController";

export default function AuthProvider({ children }) {
  const auth = useAppController();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}