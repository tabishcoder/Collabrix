import { useEffect, useState } from "react";

export function useViewport() {
  const getWidth = () => (typeof window === "undefined" ? 1024 : window.innerWidth);
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(getWidth());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isTiny = width < 360;
  const isLgUp = width >= 1024;
  const isBetween = !isTiny && !isLgUp; // 360..1023

  return { width, isTiny, isBetween, isLgUp };
}

