import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeClosed } from "lucide-react";
import { ROUTES } from "../../routes/routes";
import { ThemeButton, Header, AuthTabs } from "../../components/auth";

const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";

const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70";

export default function LoginPage({
  handleLogin,
  loginForm,
  setLoginForm,
  submitting,
  dark,
  setDark,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <ThemeButton dark={dark} setDark={setDark} />

      <Header />

      <AuthTabs activeTab="login" />

      <form className="grid gap-4" onSubmit={handleLogin}>
        <label className={fieldLabelClasses}>
          <span className={fieldTextClasses}>Email</span>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={18} />
            </span>

            <input
              className={`${fieldInputClasses} pl-10`}
              type="email"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
              placeholder="your@email.com"
            />
          </div>
        </label>

        <label className={fieldLabelClasses}>
          <span className={fieldTextClasses}>Password</span>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </span>

            <input
              className={`${fieldInputClasses} pl-10 pr-12`}
              type={showPassword ? "text" : "password"}
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="••••••••"
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-indigo-500 hover:text-indigo-600"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            Forgot Password?
          </button>
        </div>

        <button
          className={primaryButtonClasses}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Signing In..." : "Login"}
        </button>
      </form>
    </>
  );
}
