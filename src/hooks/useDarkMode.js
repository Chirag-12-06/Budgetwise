import { useEffect, useState } from "react";

export default function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem("bw-dark") === "1");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bw-dark", dark ? "1" : "0");
  }, [dark]);

  return {
    dark,
    setDark,
  };

}