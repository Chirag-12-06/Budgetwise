import AuthContext from "../context/AuthContext";
import useAuthController from "../hooks/auth/useAuthController";
import { useEffect } from "react";

export default function AuthProvider({ children }) {
  const auth = useAuthController();

  useEffect(() => {
    console.log("AuthProvider mounted");

    return () => {
      console.log("AuthProvider unmounted");
    };
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
