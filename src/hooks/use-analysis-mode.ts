import { useCallback, useEffect, useState } from "react";

const KEY = "cyrano.analysisMode";

/**
 * Global preference: off by default. When off, Cyrano returns only the
 * recommendation (suggested replies / actions). When on, the fuller
 * analysis is included.
 */
export function useAnalysisMode() {
  const [analysis, setAnalysis] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAnalysis(window.localStorage.getItem(KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setAnalysis((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  return { analysis, toggle };
}
