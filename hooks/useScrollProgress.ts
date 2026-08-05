import { useEffect, useState } from "react";

/**
 * Returns the page scroll progress (0–1) and whether the page has been
 * scrolled at all. Debounced via requestAnimationFrame for performance.
 */
export function useScrollProgress(): { progress: number; scrolled: boolean } {
  const [state, setState] = useState({ progress: 0, scrolled: false });

  useEffect(() => {
    let rafId: number;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setState({ progress, scrolled: scrollTop > 8 });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // initialise

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return state;
}
