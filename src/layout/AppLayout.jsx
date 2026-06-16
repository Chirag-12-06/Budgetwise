import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout({
  user,
  handleLogout,
  dark,
  setDark,
}) {
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
                dark={dark}
                setDark={setDark}
            />
            <Outlet />
            </section>
        </section>
      </main>
    </div>
  );
}