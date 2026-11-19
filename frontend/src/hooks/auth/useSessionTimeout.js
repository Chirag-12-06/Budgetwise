import { useCallback, useEffect, useRef } from "react";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_IDLE_MINUTES = parsePositiveNumber(
  import.meta.env.VITE_SESSION_IDLE_MINUTES,
  15,
);

const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_MINUTES * 60 * 1000;

export default function useSessionTimeout({ user, resetToLoggedOutState }) {
  const inactivityTimeoutRef = useRef(null);
  const resetCallbackRef = useRef(resetToLoggedOutState);

  const isAuthenticated = Boolean(user);

  // Keep the latest logout/reset callback
  useEffect(() => {
    resetCallbackRef.current = resetToLoggedOutState;
  }, [resetToLoggedOutState]);

  // Clear inactivity timer
  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current === null) return;

    window.clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimeout();
      return;
    }

    let hasLoggedOut = false;

    function resetInactivityTimer() {
      clearInactivityTimeout();

      inactivityTimeoutRef.current = window.setTimeout(() => {
        if (hasLoggedOut) return;

        hasLoggedOut = true;

        resetCallbackRef.current({
          message: `Logged out after ${SESSION_IDLE_MINUTES} minutes of inactivity`,
          type: "error",
        });
      }, SESSION_IDLE_TIMEOUT_MS);
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, {
        passive: true,
      });
    });

    resetInactivityTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });

      clearInactivityTimeout();
    };
  }, [isAuthenticated, clearInactivityTimeout]);

  return {
    clearInactivityTimeout,
  };
}
