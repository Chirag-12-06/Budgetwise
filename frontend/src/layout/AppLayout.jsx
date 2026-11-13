import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useTheme } from "../hooks/ui/useTheme";

export default function AppLayout({
  user,
  handleLogout,
}) {
  const { dark, setDark } = useTheme();
  return (
    <div
      className={`min-h-screen ${
        dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="min-h-screen px-4 pb-8">
        <section className="mx-auto w-full">
            <section className="grid gap-6">
            <Navbar
                user={user}
                handleLogout={handleLogout}
            />
            <Outlet />
            </section>
        </section>
      </main>
    </div>
  );
}