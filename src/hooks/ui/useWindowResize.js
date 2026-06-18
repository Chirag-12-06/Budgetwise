import { useEffect, useState } from "react";

export default function useWindowResize() {
  // Forces app re-render when viewport size changes.
  // Needed because several components directly read window.innerWidth.
  const [, setResizeTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let frameId = 0;
    let previousWidth = window.innerWidth;
    let previousHeight = window.innerHeight;

    function syncResizeState() {
      frameId = 0;

      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      if (nextWidth === previousWidth && nextHeight === previousHeight) {
        return;
      }

      previousWidth = nextWidth;
      previousHeight = nextHeight;
      setResizeTick((current) => current + 1);
    }

    function handleResize() {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(syncResizeState);
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);
}