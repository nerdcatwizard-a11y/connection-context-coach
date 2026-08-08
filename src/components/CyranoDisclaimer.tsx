import { Info, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  variant?: "inline" | "compact";
  className?: string;
}

const TEXT =
  "I'm Cyrano, your dating app assistant and AI dating and relationship coach. I can offer educational guidance and help you think through dating app situations, but I'm not a licensed therapist or mental-health professional. If something feels urgent, please reach out to local emergency services or a trusted person.";

export function CyranoDisclaimer({ variant = "inline", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  if (variant === "compact") {
    return <p className={`text-xs text-muted-foreground ${className}`}>{TEXT}</p>;
  }

  return (
    <div className={className}>
      {/* Mobile: one compact line that expands on tap */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-2 py-1.5 text-left text-[11px] leading-none text-muted-foreground"
        >
          <Info className="h-3 w-3 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 whitespace-nowrap">
            Cyrano is your dating app assistant — not a therapist.
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <p className="mt-2 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {TEXT}
          </p>
        )}
      </div>


      {/* Desktop: full box */}
      <div className="hidden gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground md:flex">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">I'm Cyrano</span>, your dating
          app assistant and AI dating and relationship coach. I can offer educational
          guidance and help you think through dating app situations, but I'm not a
          licensed therapist or mental-health professional. If something feels urgent,
          please reach out to local emergency services or a trusted person.
        </p>
      </div>
    </div>
  );
}
