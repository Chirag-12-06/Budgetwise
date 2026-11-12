import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { ROUTES } from "../routes/routes";
import { clearStoredUser, logoutUser } from "../api/auth.api";
import { getCurrentUser } from "../api/user.api";

import useAuthController from "./auth/useAuthController";
import useSessionTimeout from "./auth/useSessionTimeout";
import useStatusMessage from "./auth/useStatusMessage";

export default function useAppController() {
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Analytics preference
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState(
    searchParams.get("groupBy") || "daily",
  );

  // Global status
  const { status, showStatus, clearStatus } = useStatusMessage();

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

  // Reset authentication state on logout
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

  // Authentication actions
  const {
    handleLogin,
    handleSignup,
    handleUpdateProfile,
    handleForgotPassword,
    handleLogout,
  } = useAuthController({
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

  // Analytics grouping preference
  function handleAnalyticsGroupByChange(value) {
    setAnalyticsGroupBy(value);

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("groupBy", value);

      return next;
    });
  }

  return {
    // Theme
    dark,
    setDark,

    // Status
    status,
    showStatus,
    clearStatus,
    handleApiError,

    // Authentication state
    user,
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
    handleForgotPassword,
    handleUpdateProfile,
    handleLogout,

    // Analytics preference
    analyticsGroupBy,
    handleAnalyticsGroupByChange,
  };
}
