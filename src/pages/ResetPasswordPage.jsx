import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPasswordUser } from "../lib/auth";
import { ROUTES } from "../lib/routes";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();


  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const data = await resetPasswordUser(token, password);

      setMessage(data.message || "Password reset successful");
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 2000);

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message || "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form className="w-full max-w-md space-y-4"
        onSubmit={handleSubmit}
      >
        <h1 className="text-3xl font-bold text-center">
          Reset Password
        </h1>

        <input
          className="w-full rounded-md border px-4 py-3"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="w-full rounded-md border px-4 py-3"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {message && (
          <div className="text-sm text-red-500">
            {message}
          </div>
        )}

        <button
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white"
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}