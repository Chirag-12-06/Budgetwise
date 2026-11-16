import { useCallback, useEffect, useState } from "react";

export default function useBubbleBoardSize() {
  const [bubbleBoardSize, setBubbleBoardSize] = useState({
    width: 0,
    height: 0,
  });

  const [bubbleBoardRef, setBubbleBoardRef] = useState(null);

  const bubbleBoardRefCallback = useCallback((node) => {
    setBubbleBoardRef(node);
  }, []);

  useEffect(() => {
    if (!bubbleBoardRef) return;

    const updateSize = () => {
      const nextWidth = Math.round(bubbleBoardRef.clientWidth);
      const nextHeight = Math.round(bubbleBoardRef.clientHeight);

      setBubbleBoardSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(bubbleBoardRef);

    return () => resizeObserver.disconnect();
  }, [bubbleBoardRef]);

  return {
    bubbleBoardRef: bubbleBoardRefCallback,
    bubbleBoardSize,
  };
}
