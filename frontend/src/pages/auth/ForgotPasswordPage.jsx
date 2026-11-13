import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

import { ROUTES } from "../../routes/routes";
import ThemeButton from "../../components/auth/themeButton";

const fieldLabelClasses = "grid gap-2";

const fieldTextClasses = "text-[0.92rem] font-semibold";

const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70";

export default function ForgotPasswordPage({
  handleForgotPassword,
  submitting,
}) {
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    await handleForgotPassword(forgotEmail);
  };

  return (
    <div className="grid gap-6">
      <ThemeButton />

      <header className="pt-8 text-center">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Forgot Password?
        </h1>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Enter your email to receive a password reset link.
        </p>
      </header>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className={fieldLabelClasses}>
          <span className={fieldTextClasses}>Email</span>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={18} />
            </span>

            <input
              className={`${fieldInputClasses} pl-10`}
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
        </label>

        {forgotMessage && (
          <div className="rounded-md bg-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900 dark:text-green-200">
            {forgotMessage}
          </div>
        )}

        <button
          className={primaryButtonClasses}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>

        <button
          type="button"
          className="text-sm text-indigo-500 hover:text-indigo-600"
          onClick={() => navigate(ROUTES.LOGIN)}
        >
          ← Back to Login
        </button>
      </form>
    </div>
  );
}
