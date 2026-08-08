import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkle } from "lucide-react";

type ResetSearch = {
  email?: string;
  set?: number;
};

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    email: typeof search['email'] === "string" ? search['email'] : undefined,
    set: search['set'] ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password — Cyrano" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { email: initialEmail, set } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">(set ? "update" : "request");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "PASSWORD_RECOVERY") return;
      setMode("update");
      if (session?.user.email) setEmail(session.user.email);
    });

    if (window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/reset-password?set=1",
      });
      if (error) throw error;
      toast.success("Check your email for the password-reset link. Keep this page open until it says the password was saved and verified.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submitted = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmPassword") ?? "");
    if (submitted !== confirmation) {
      toast.error("Passwords don't match.");
      return;
    }
    if (!email) {
      toast.error("Your account email is still loading. Please try again.");
      return;
    }
    setBusy(true);
    try {
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      const currentEmail = currentUser.user?.email?.trim().toLowerCase();
      if (userError || !currentEmail || currentEmail !== email.trim().toLowerCase()) {
        throw new Error("This reset link does not match the signed-in account. Please request a new one.");
      }

      const { error } = await supabase.auth.updateUser({ password: submitted });
      if (error) throw error;

      toast.success("Password saved. Accept your phone's prompt to update the saved password.");
      setTimeout(() => navigate({ to: "/home", replace: true }), 900);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl">Cyrano</span>
        </Link>
        <div className="mt-8 w-full soft-card p-6">
          <h1 className="font-serif text-2xl">
            {mode === "update" ? "Set your password" : "Reset your password"}
          </h1>
          {mode === "update" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the password you want to use from now on. When your phone offers to save or
              update it, tap yes — then autofill will sign you in every time.
            </p>
          )}
          {mode === "request" ? (
            <form onSubmit={requestReset} className="mt-4 space-y-3">
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onInput={(e) => setEmail(e.currentTarget.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              />
              <button
                disabled={busy}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="mt-4 space-y-3" method="post" action="#">
              <label htmlFor="reset-account-email" className="text-xs font-medium text-muted-foreground">
                Account email
              </label>
              <input
                id="reset-account-email"
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                readOnly
                className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm text-muted-foreground"
              />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="New password"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              />
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
              />
              <button
                disabled={busy}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save password"}
              </button>
            </form>
          )}
          <Link to="/auth" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
