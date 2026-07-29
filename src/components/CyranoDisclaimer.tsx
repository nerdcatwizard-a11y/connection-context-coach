import { Info } from "lucide-react";

interface Props {
  variant?: "inline" | "compact";
  className?: string;
}

export function CyranoDisclaimer({ variant = "inline", className = "" }: Props) {
  const text =
    "I'm Cyrano, your dating app assistant and AI dating and relationship coach. I can offer educational guidance and help you think through dating site situations, but I'm not a licensed therapist or mental-health professional. If something feels urgent, please reach out to local emergency services or a trusted person.";
  if (variant === "compact") {
    return <p className={`text-xs text-muted-foreground ${className}`}>{text}</p>;
  }
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        <span className="font-medium text-foreground">I'm Cyrano</span>, your dating
        site assistant and AI dating and relationship coach. I can offer educational
        guidance and help you think through dating site situations, but I'm not a
        licensed therapist or mental-health professional. If something feels urgent,
        please reach out to local emergency services or a trusted person.
      </p>
    </div>
  );
}
