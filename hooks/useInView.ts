import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /** Root margin — defaults to "0px 0px -80px 0px" so reveal fires
   *  before the element fully enters the viewport. */
  rootMargin?: string;
  /** Intersection threshold (0–1). Default 0. */
  threshold?: number;
  /** If true the observer disconnects after first intersection (default true). */
  once?: boolean;
}

/**
 * Returns a ref to attach to the observed element and a boolean `inView`.
 * Once the element intersects (when `once` is true) the ref is unobserved
 * and `inView` stays true — ideal for one-shot CSS reveal animations.
 */
export function useInView<T extends Element = HTMLElement>({
  rootMargin = "0px 0px -80px 0px",
  threshold = 0,
  once = true,
}: UseInViewOptions = {}): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip when the browser doesn't support IntersectionObserver
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return [ref, inView];
}
