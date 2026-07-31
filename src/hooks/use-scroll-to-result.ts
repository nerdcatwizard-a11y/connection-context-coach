import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a results container. Whenever `ready` becomes
 * truthy, the page scrolls so the TOP of the answer sits just below the top
 * of the viewport (like ChatGPT). Retries a few times because the answer can
 * still be growing/laying out right after it appears (especially on mobile).
 */
export function useScrollToResult<T extends HTMLElement = HTMLDivElement>(ready: unknown) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;

    const timers: number[] = [];
    const scroll = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };

    // Wait for layout, then re-assert a couple of times as content settles.
    const raf = window.requestAnimationFrame(() => {
      scroll();
      timers.push(window.setTimeout(scroll, 250));
      timers.push(window.setTimeout(scroll, 700));
    });

    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [ready]);

  return ref;
}
