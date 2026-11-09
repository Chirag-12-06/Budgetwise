import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPasswordUser } from "../api/auth.api";
import { ROUTES } from "../routes/routes";

export default function ResetPasswordPage({ showStatus }) {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showStatus("Passwords do not match", "error");
      return;
    }

    setSubmitting(true);

    try {
      const data = await resetPasswordUser(token, password);

      showStatus(data.message || "Password reset successful", "success");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (error) {
      showStatus(error.message || "Unable to reset password", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold text-center">Reset Password</h1>

        <input
          className="w-full rounded-md border px-4 py-3"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          maxLength={128}
          required
        />

        <input
          className="w-full rounded-md border px-4 py-3"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
