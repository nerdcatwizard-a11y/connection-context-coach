import { useEffect } from "react";

/**
 * Attach a global paste listener that captures image files
 * from the clipboard anywhere on the page and passes them
 * to `onFiles`. Enabled while `active` is true.
 */
export function usePasteImages(
  onFiles: (files: FileList | File[]) => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    function handler(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        onFiles(files);
      }
    }
    window.addEventListener("paste", handler as EventListener);
    return () => window.removeEventListener("paste", handler as EventListener);
  }, [onFiles, active]);
}
