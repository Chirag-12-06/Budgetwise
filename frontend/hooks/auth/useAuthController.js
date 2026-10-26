import {
  forgotPasswordUser,
  loginUser,
  signupUser,
  updateProfileUser,
  hasToken,
} from "../../lib/auth";
import { ROUTES } from "../../lib/routes";

export default function useAuthController({
  loginForm,
  signupForm,
  user,
  setUser,
  navigate,
  setSubmitting,
  setUpdatingProfile,
  showStatus,
  resetToLoggedOutState,
  clearStatus,
}) {

async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    clearStatus();
    try {
      const data = await loginUser(loginForm);
      setUser(data.user);
      navigate(ROUTES.HOME);
      showStatus("Login successful", "success");
    } catch (error) {
      showStatus(error?.message || "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    clearStatus();
    if (signupForm.password !== signupForm.confirmPassword) {
      showStatus("Passwords do not match", "error");
      return;
    }
    setSubmitting(true);
    try {
      const data = await signupUser(signupForm);
      setUser(data.user);
      navigate(ROUTES.HOME);
      showStatus("Account created successfully.", "success");
    } catch (error) {
      showStatus(error?.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(email) {
  try {
    const data = await forgotPasswordUser(email);

    showStatus(
      data.message || "Reset instructions sent.",
      "success"
    );

    return { ok: true };
  } catch (error) {
    showStatus(
      error?.message || "Unable to send reset instructions",
      "error"
    );

    return {
      ok: false,
      message: error?.message,
    };
  }
}

  async function handleUpdateProfile(profilePayload) {
    setUpdatingProfile(true);
    try {
      const data = await updateProfileUser(profilePayload);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      if (user && !hasToken()) {
        resetToLoggedOutState({
          message: error?.message || "Session expired. Please log in again.",
          type: "error",
        });
      }

      return {
        ok: false,
        message: error?.message || "Unable to update profile",
      };
    } finally {
      setUpdatingProfile(false);
    }
  }

  function handleLogout() {
    resetToLoggedOutState();
  }

  return {
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleUpdateProfile,
      handleLogout,
   };
}