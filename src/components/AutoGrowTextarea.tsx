import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxRows?: number;
};

/**
 * Textarea that grows vertically as the user types instead of scrolling
 * horizontally, up to `maxRows` lines, then scrolls internally.
 */
export function AutoGrowTextarea({ className, maxRows = 8, value, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight || "20") || 20;
    const padding = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
    const border =
      parseFloat(style.borderTopWidth || "0") + parseFloat(style.borderBottomWidth || "0");
    const max = lineHeight * maxRows + padding + border;
    const next = Math.min(el.scrollHeight + border, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight + border > max ? "auto" : "hidden";
  }, [value, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      className={cn("resize-none", className)}
      {...props}
    />
  );
}
