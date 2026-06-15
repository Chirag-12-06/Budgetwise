import { useEffect, useRef, useState } from "react";

export default function useBubbleBoardSize(
    chartCategoriesLength,
  visibleCategoriesLength
){
  const bubbleBoardRef = useRef(null);
  
  const [bubbleBoardSize, setBubbleBoardSize] = useState({ 
        width: 0, 
        height: 0 
    });

  useEffect(() => {
    const board = bubbleBoardRef.current;
    if (!board) {
      return undefined;
    }

    const updateSize = () => {
      const nextWidth = Math.round(board.clientWidth);
      const nextHeight = Math.round(board.clientHeight);
      setBubbleBoardSize((current) => (
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      ));
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(board);
    return () => {
      resizeObserver.disconnect();
    };
  }, [chartCategories.length, visibleCategories.length]);
  return { bubbleBoardRef, bubbleBoardSize
  };
}