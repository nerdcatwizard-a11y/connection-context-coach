import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BackToDashboard } from "@/components/BackToDashboard";
import { supabase } from "@/integrations/supabase/client";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";
import { deleteMyAccount } from "@/lib/account-client";
import { useUsage } from "@/hooks/use-usage";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const navigate = useNavigate();
  const { isPremium } = useUsage();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      toast.success("Your account and data have been deleted.");
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
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
        {isPremium ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              You're subscribed — everything is unlocked. Manage or cancel in device Settings &gt;
              Apple ID &gt; Subscriptions.
            </p>
            <span className="mt-3 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Premium active
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
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

      <div className="soft-card p-6">
        <h2 className="font-serif text-lg">Legal &amp; help</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read the terms that cover your subscription, how your data is handled, or get in touch.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/terms"
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Terms of Use (EULA)
          </Link>
          <Link
            to="/privacy"
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Privacy Policy
          </Link>
          <Link
            to="/support"
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Support
          </Link>
        </div>
      </div>

      <div className="soft-card border-destructive/30 p-6">
        <h2 className="font-serif text-lg">Delete my account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently deletes your account and everything in it — chats, journal entries,
          connections, and uploaded screenshots. This can't be undone. An active subscription must
          be cancelled separately in your device Settings.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-full border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <label className="block text-sm">
              Type <strong>DELETE</strong> to confirm
              <input
                value={confirmText}
                onInput={(e) => setConfirmText((e.target as HTMLInputElement).value)}
                onChange={(e) => setConfirmText(e.target.value)}
                autoCapitalize="characters"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-base"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleDelete()}
                disabled={busy || confirmText.trim().toUpperCase() !== "DELETE"}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                }}
                disabled={busy}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <CyranoDisclaimer />
    </div>
  );
}
