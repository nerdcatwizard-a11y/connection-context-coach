import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Sparkle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Cyrano" },
      { name: "description", content: "Sign in to Cyrano, your private AI dating coach." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/home" },
        });
        if (error) throw error;
        toast.success("Check your email (and spam folder) to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin + "/home" },
      });
      if (error) throw error;
      toast.success("Confirmation email resent. Check your inbox and spam folder.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't resend email");
    } finally {
      setResending(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/home",
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl">Cyrano</span>
        </Link>

        <div className="mt-8 w-full soft-card p-6">
          <h1 className="font-serif text-2xl">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Private, calm, and always in your voice."
              : "Sign in to keep the conversation going."}
          </p>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              Continue with Apple
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            <span className="relative mx-auto block w-fit bg-card px-3 text-xs text-muted-foreground">
              or with email
            </span>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="hover:text-foreground">
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
            <Link to="/reset-password" className="hover:text-foreground">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
          Cyrano provides AI coaching and educational guidance. It is not a licensed
          therapist, medical professional, or crisis service.
        </p>
      </div>
    </div>
  );
}
