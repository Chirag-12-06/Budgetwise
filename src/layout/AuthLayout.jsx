import { Outlet } from "react-router-dom";

export default function AuthLayout(dark) {
  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="min-h-screen px-4 pb-8">
        <section className="mx-auto max-w-xl">
          <Outlet />
        </section>
      </main>
    </div>
  );
}