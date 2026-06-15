import {useEffect, useRef} from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_IDLE_MINUTES = parsePositiveNumber(import.meta.env.VITE_SESSION_IDLE_MINUTES, 15);
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_MINUTES * 60 * 1000;


export default function useSessionTimeout({
  user,
  resetToLoggedOutState,
}) {

  const inactivityTimeoutRef = useRef(null);

  function clearInactivityTimeout() {
      if (!inactivityTimeoutRef.current) {
        return;
      }
  
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    useEffect(() => {
    if (!user) {
      clearInactivityTimeout();
      return undefined;
    }

    let isLoggingOut = false;

    function resetInactivityTimer() {
      clearInactivityTimeout();
      inactivityTimeoutRef.current = window.setTimeout(() => {
        if (isLoggingOut) {
          return;
        }

        isLoggingOut = true;
        resetToLoggedOutState({
          message: `Logged out after ${SESSION_IDLE_MINUTES} minutes of inactivity`,
          type: "error",
        });
      }, SESSION_IDLE_TIMEOUT_MS);
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    }

    resetInactivityTimer();

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetInactivityTimer);
      }

      clearInactivityTimeout();
    };
  }, [user]);

  return {
  clearInactivityTimeout,
};

}


