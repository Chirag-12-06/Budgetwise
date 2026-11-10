import handleAvatarFileChange from "../../utils/avatar";
import { ThemeButton, Header, AuthTabs } from "../../components/auth";

const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";

const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70";

export default function SignupPage({
  handleSignup,
  signupForm,
  setSignupForm,
  submitting,
  dark,
  setDark,
}) {
  return (
    <>
      <ThemeButton dark={dark} setDark={setDark} />

      <Header />

      <AuthTabs activeTab="signup" />

      <form className="grid gap-4" onSubmit={handleSignup}>
        <label className={fieldLabelClasses}>
          <span className={fieldTextClasses}>Full Name</span>

          <input
            className={fieldInputClasses}
            type="text"
            value={signupForm.name}
            onChange={(event) =>
              setSignupForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
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

          <span className="text-xs text-gray-500 dark:text-gray-300">
            PNG/JPG up to 2 MB.
          </span>
        </label>

        {signupForm.avatarDataUrl && (
          <div className="flex items-center gap-3">
            <img
              src={signupForm.avatarDataUrl}
              alt="Profile preview"
              className="h-14 w-14 rounded-full border border-gray-300 object-cover dark:border-gray-600"
            />

            <button
              type="button"
              className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() =>
                setSignupForm((current) => ({
                  ...current,
                  avatarDataUrl: "",
                }))
              }
            >
              Remove photo
            </button>
          </div>
        )}

        <label className={fieldLabelClasses}>
          <span className={fieldTextClasses}>Email</span>

          <input
            className={fieldInputClasses}
            type="email"
            value={signupForm.email}
            onChange={(event) =>
              setSignupForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
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
            onChange={(event) =>
              setSignupForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
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

        <button
          className={primaryButtonClasses}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </>
  );
}
