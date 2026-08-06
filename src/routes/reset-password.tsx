import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkle } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
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
  const { set } = Route.useSearch();
  const [mode, setMode] = useState<"request" | "update">(set ? "update" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("Check your email for a reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitted = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: submitted });
      if (error) throw error;
      toast.success("Password saved. Let your phone save it too — sign-in will just work now.");
      window.location.href = "/home";
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
              {/* Hidden username field: iOS/Android password managers need it to
                  update the saved credential for this account instead of creating a new one. */}
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onInput={(e) => setPassword(e.currentTarget.value)}
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
