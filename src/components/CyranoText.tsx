import { cn } from "@/lib/utils";

export function CyranoText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const parts = children.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
