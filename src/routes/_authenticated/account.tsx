import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BackToDashboard } from "@/components/BackToDashboard";
import { supabase } from "@/integrations/supabase/client";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="space-y-6">
      <BackToDashboard />
      <h1 className="font-serif text-3xl">Account</h1>
      <div className="soft-card p-6">
        <h2 className="font-serif text-lg">Session</h2>
        <button
          onClick={signOut}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Sign out
        </button>
      </div>
      <div className="soft-card p-6">
        <h2 className="font-serif text-lg">Cyrano Premium</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlimited coaching, replies and screenshot reads. Purchased through your App Store
          account.
        </p>
        <button
          onClick={() => navigate({ to: "/pricing" })}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Upgrade or restore purchase
        </button>
      </div>
      <div className="soft-card p-6">
        <h2 className="font-serif text-lg">Onboarding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review or update your preferences.
        </p>
        <button
          onClick={() => navigate({ to: "/welcome" })}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Update preferences
        </button>
      </div>

      <CyranoDisclaimer />
    </div>
  );
}
