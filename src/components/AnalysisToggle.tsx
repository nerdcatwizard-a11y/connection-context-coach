import { cn } from "@/lib/utils";

export function AnalysisToggle({
  analysis,
  onToggle,
  className,
}: {
  analysis: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium">Show Cyrano's analysis</p>
        <p className="text-xs text-muted-foreground">
          Off: just the recommendations. On: the reasoning behind them.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={analysis}
        aria-label="Show Cyrano's analysis"
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          analysis ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all",
            analysis ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
