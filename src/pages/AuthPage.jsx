const LOGIN = "login";
const SIGNUP = "signup";

const authTabClasses =
  "rounded-2xl px-4 py-3.5 transition-colors";
const activeAuthTabClasses = "bg-blue-600 text-white";
const inactiveAuthTabClasses = "bg-slate-400/15 text-inherit";
const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";
const fieldInputClasses =
  "w-full rounded-[14px] border border-slate-400/35 bg-white/70 px-4 py-3.5 text-inherit dark:bg-slate-950/45";
const primaryButtonClasses =
  "rounded-2xl border-0 bg-[linear-gradient(135deg,#2563eb_0%,#0f766e_100%)] px-4 py-4 font-bold text-white disabled:cursor-wait disabled:opacity-70";

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
}) {
  return (
    <>
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
            <input
              className={fieldInputClasses}
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              required
              placeholder="••••••••"
            />
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
