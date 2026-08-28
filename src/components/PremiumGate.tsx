import { Link } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useUsage } from "@/hooks/use-usage";
import { BackToDashboard } from "@/components/BackToDashboard";


/**
 * Renders children only for Premium accounts. Free accounts see a lock card.
 * This is presentation only — the server enforces the same rule on every call.
 */
export function PremiumGate({
  feature,
  blurb,
  children,
}: {
  feature: string;
  blurb?: string;
  children: ReactNode;
}) {
  const { isPremium, loading } = useUsage();

  if (loading) {
    return (
      <div className="soft-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your plan…
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  return (
    <div className="soft-card space-y-3 p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="font-serif text-xl">{feature} is a Premium feature</h2>
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">
        {blurb ??
          "Unlock it with Cyrano Premium — unlimited coaching, replies, screenshot reads and profile reviews."}
      </p>
      <Link
        to="/pricing"
        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Unlock with Premium
      </Link>
    </div>
  );
}
