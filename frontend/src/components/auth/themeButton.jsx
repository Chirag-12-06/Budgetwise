import Button from "../ui/Button";
import { useTheme } from "../../hooks/ui/useTheme";

export default function ThemeButton() {
  const { dark, setDark } = useTheme();
  return (
    <div className="flex justify-end pt-4">
    <Button
      className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      type="button"
      onClick={() => setDark((value) => !value)}
    >
      {dark ? "☀️" : "🌙"}
    </Button>
    </div>
  );
}
