import ThemeContext from "../context/ThemeContext";
import { useEffect, useState } from "react";

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(
    () => localStorage.getItem("bw-dark") === "1",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bw-dark", dark ? "1" : "0");
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
