import { useState } from "react";

const LOGIN = "login";
const SIGNUP = "signup";

const authTabClasses =
  "rounded-md px-4 py-3 transition-colors";
const activeAuthTabClasses = "bg-indigo-600 text-white";
const inactiveAuthTabClasses = "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white";
const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";
const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70";
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

export default function AuthPage({
  mode,
  setMode,
  handleLogin,
  handleSignup,
  loginForm,
  setLoginForm,
  signupForm,
  setSignupForm,
  submitting,
  dark,
  setDark,
}) {

  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setSignupForm((current) => ({ ...current, avatarDataUrl: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      window.alert("Please choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarDataUrl = typeof reader.result === "string" ? reader.result : "";
      setSignupForm((current) => ({ ...current, avatarDataUrl }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="flex justify-end pt-4">
        <button
          className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          type="button"
          onClick={() => setDark((value) => !value)}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      <header className="pt-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">Welcome to</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 dark:text-white">Budgetwise</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Track every rupee, every day.</p>
      </header>

      <div className="my-6 grid grid-cols-2 gap-3" role="tablist" aria-label="Authentication mode">
        <button
          className={`${authTabClasses} ${mode === LOGIN ? activeAuthTabClasses : inactiveAuthTabClasses}`}
          type="button"
          onClick={() => setMode(LOGIN)}
        >
          Login
        </button>
        <button
          className={`${authTabClasses} ${mode === SIGNUP ? activeAuthTabClasses : inactiveAuthTabClasses}`}
          type="button"
          onClick={() => setMode(SIGNUP)}
        >
          Sign Up
        </button>
      </div>

      {mode === LOGIN ? (
        <form className="grid gap-4" onSubmit={handleLogin}>
          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Email</span>
            <input
              className={fieldInputClasses}
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="your@email.com"
            />
          </label>

          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Password</span>
            {/* <input
              className={fieldInputClasses}
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              required
              placeholder="••••••••"
            /> */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔒
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
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          <button className={primaryButtonClasses} type="submit" disabled={submitting}>
            {submitting ? "Signing In..." : "Login"}
          </button>
        </form>
      ) : (
        <form className="grid gap-4" onSubmit={handleSignup}>
          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Full Name</span>
            <input
              className={fieldInputClasses}
              type="text"
              value={signupForm.name}
              onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder="John Doe"
            />
          </label>

          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Profile Photo (optional)</span>
            <input
              className={`${fieldInputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700`}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
            <span className="text-xs text-gray-500 dark:text-gray-300">PNG/JPG up to 2 MB.</span>
          </label>

          {signupForm.avatarDataUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={signupForm.avatarDataUrl}
                alt="Profile preview"
                className="h-14 w-14 rounded-full border border-gray-300 object-cover dark:border-gray-600"
              />
              <button
                type="button"
                className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => setSignupForm((current) => ({ ...current, avatarDataUrl: "" }))}
              >
                Remove photo
              </button>
            </div>
          ) : null}

          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Email</span>
            <input
              className={fieldInputClasses}
              type="email"
              value={signupForm.email}
              onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="your@email.com"
            />
          </label>

          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Password</span>
            <input
              className={fieldInputClasses}
              type="password"
              value={signupForm.password}
              onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </label>

          <label className={fieldLabelClasses}>
            <span className={fieldTextClasses}>Confirm Password</span>
            <input
              className={fieldInputClasses}
              type="password"
              value={signupForm.confirmPassword}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              required
              minLength={6}
              placeholder="••••••••"
            />
          </label>

          <button className={primaryButtonClasses} type="submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}
    </>
  );
}
