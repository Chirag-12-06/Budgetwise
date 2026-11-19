import AuthContext from "../context/AuthContext";
import useAuthController from "../hooks/auth/useAuthController";

export default function AuthProvider({ children }) {
  const auth = useAuthController();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}