import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Traps keyboard focus within a container while `active` is true.
 * - Moves focus into the container on activation.
 * - Cycles Tab / Shift+Tab within the container's focusable elements.
 * - Restores focus to the previously focused element on deactivation.
 *
 * Attach the returned ref to the dialog container element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Remember what was focused so we can restore it on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Move focus into the dialog on the next frame. Deferring past the current
    // commit avoids the click event that opened the dialog re-focusing its own
    // trigger button after this effect runs. Prefer the first focusable control,
    // otherwise focus the container itself (needs tabindex="-1").
    const rafId = requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !container.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger if it still exists in the document.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return containerRef;
}
