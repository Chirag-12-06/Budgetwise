
import {
  updateProfileUser,
  loginUser,
  signupUser,
  logoutUser,
} from "../../api/auth.api";

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

      showStatus(
        "Account created successfully. Please log in.",
        "success"
      );

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

  return {
    handleLogin,
    handleSignup,
    handleUpdateProfile,
    handleLogout,
  };
}
