import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a results container. Whenever `ready` becomes
 * truthy, the page scrolls down to the top of the answer so the user
 * immediately sees Cyrano's response.
 */
export function useScrollToResult<T extends HTMLElement = HTMLDivElement>(ready: unknown) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [ready]);
  return ref;
}
