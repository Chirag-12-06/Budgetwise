import {
  loginUser,
  signupUser,
  logoutUser,
  forgotPasswordUser,
} from "../../api/auth.api";
import { updateProfileUser } from "../../api/user.api";

import { ROUTES } from "../../routes/routes";

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
      await signupUser(signupForm);

      showStatus("Account created successfully. Please log in.", "success");

      navigate(ROUTES.LOGIN);
    } catch (error) {
      showStatus(error?.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProfile(profilePayload) {
    setUpdatingProfile(true);

    try {
      const data = await updateProfileUser(profilePayload);

      setUser(data.user);

      return {
        ok: true,
        user: data.user,
      };
    } catch (error) {
      return {
        ok: false,
        message: error?.message || "Unable to update profile",
      };
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      resetToLoggedOutState();
    }
  }

  async function handleForgotPassword(email) {
    try {
      const response = await forgotPasswordUser(email);

      showStatus(
        response.data.message || "Reset instructions sent.",
        "success",
      );

      return { ok: true };
    } catch (error) {
      showStatus(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send reset instructions",
        "error",
      );

      return {
        ok: false,
        message: error?.response?.data?.message || error?.message,
      };
    }
  }

  return {
    handleLogin,
    handleSignup,
    handleUpdateProfile,
    handleLogout,
    handleForgotPassword,
  };
}
