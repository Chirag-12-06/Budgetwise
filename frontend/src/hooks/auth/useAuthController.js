import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  clearStoredUser,
  loginUser,
  signupUser,
  logoutUser,
  forgotPasswordUser,
} from "../../api/auth.api";

import { getCurrentUser, updateProfileUser } from "../../api/user.api";
import { ROUTES } from "../../routes/routes";

import useSessionTimeout from "./useSessionTimeout";
import useStatus from "./useStatus";

export default function useAuthController() {
  const navigate = useNavigate();

  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Authentication forms
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatarDataUrl: "",
  });

  // Status
  const { showStatus, clearStatus } = useStatus();

  // Reset authentication state
  function resetToLoggedOutState({
    message = "Logged out",
    type = "success",
  } = {}) {
    showStatus(message, type);

    clearInactivityTimeout();
    logoutUser();

    setUser(null);

    setLoginForm({
      email: "",
      password: "",
    });

    setSignupForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatarDataUrl: "",
    });

    navigate(ROUTES.LOGIN);
  }

  // Session timeout
  const { clearInactivityTimeout } = useSessionTimeout({
    user,
    resetToLoggedOutState,
  });

  // Restore authenticated session
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          clearStoredUser();
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Login
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

  // Signup
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

  // Update profile
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

  // Logout
  async function handleLogout() {
    resetToLoggedOutState();
  }

  // Forgot password
  async function handleForgotPassword(email) {
    try {
      const response = await forgotPasswordUser(email);

      showStatus(
        response.data.message || "Reset instructions sent.",
        "success",
      );

      return { ok: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send reset instructions";

      showStatus(message, "error");

      return {
        ok: false,
        message,
      };
    }
  }

  // Handle API errors
  function handleApiError(error, fallbackMessage) {
    const message = error?.message || fallbackMessage;

    if (!user) {
      resetToLoggedOutState({
        message: message || "Please log in to continue.",
        type: "error",
      });
      return;
    }

    showStatus(message, "error");
  }

  return {
    // Status
    handleApiError,

    // Authentication state
    user,
    setUser,
    authLoading,
    submitting,
    updatingProfile,

    // Authentication forms
    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,

    // Authentication actions
    handleLogin,
    handleSignup,
    handleUpdateProfile,
    handleLogout,
    handleForgotPassword,

    // Session
    resetToLoggedOutState,
    clearInactivityTimeout,
  };
}
