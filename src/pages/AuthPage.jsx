const LOGIN = "login";
const SIGNUP = "signup";

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
      <div className="tab-row" role="tablist" aria-label="Authentication mode">
        <button className={mode === LOGIN ? "tab active" : "tab"} type="button" onClick={() => setMode(LOGIN)}>
          Login
        </button>
        <button className={mode === SIGNUP ? "tab active" : "tab"} type="button" onClick={() => setMode(SIGNUP)}>
          Sign Up
        </button>
      </div>

      {mode === LOGIN ? (
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="your@email.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              required
              placeholder="••••••••"
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Signing In..." : "Login"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSignup}>
          <label>
            <span>Full Name</span>
            <input
              type="text"
              value={signupForm.name}
              onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder="John Doe"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={signupForm.email}
              onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="your@email.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={signupForm.password}
              onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
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

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}
    </>
  );
}
