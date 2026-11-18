import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useTheme } from "../hooks/ui/useTheme";
import useAuth from "../hooks/auth/useAuthController";

export default function AppLayout() {
  const { dark } = useTheme();
  const { user, handleLogout } = useAuth();
  return (
    <div
      className={`min-h-screen ${
        dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="min-h-screen px-4 pb-8">
        <section className="mx-auto w-full">
          <section className="grid gap-6">
            <Navbar user={user} handleLogout={handleLogout} />
            <Outlet />
          </section>
        </section>
      </main>
    </div>
  );
}
