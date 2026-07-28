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
      { name: "description", content: "Sign in to Cyrano, your dating site assistant and AI dating coach." },
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
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  async function requestConfirmationEmail(targetEmail: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) throw error;
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        const identities = data.user?.identities ?? [];
        if (identities.length === 0) {
          toast.info("That email already has an account. Sign in, or use Forgot password if needed.");
          setMode("signin");
          return;
        }

        toast.success("Check your email (and spam folder) to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "Email or password didn't match. If your browser autofilled a suggested password, retype it — or use Forgot password.",
            );
          }
          throw error;
        }
        navigate({ to: "/home" });
      }


    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Enter your email above first.");
      return;
    }
    setResending(true);
    try {
      await requestConfirmationEmail(normalizedEmail);
      toast.success("Confirmation email resent. Check your inbox and spam folder.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't resend email";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("confirm")) {
        toast.info("That email is already confirmed. Please sign in instead.");
        setMode("signin");
      } else {
        toast.error(message);
      }
    } finally {
      setResending(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Cyrano — your dating site assistant
          </p>
          <h1 className="mt-2 font-serif text-2xl">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Private, calm, and always in your voice."
              : "Sign in to keep the conversation going."}
          </p>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              Continue with Google
            </button>
            <button
              type="button"
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
              name="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                name="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-16 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 my-auto h-fit text-xs text-muted-foreground hover:text-foreground"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>


          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="hover:text-foreground">
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
            <Link to="/reset-password" className="hover:text-foreground">
              Forgot password?
            </Link>
          </div>

          {mode === "signup" && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-3 w-full rounded-xl border border-dashed border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {resending ? "Resending..." : "Didn't get the email? Resend confirmation"}
            </button>
          )}
        </div>

        <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
          I'm Cyrano, your dating site assistant and AI dating and relationship coach. I
          can offer educational guidance and help you think through dating site
          situations, but I'm not a licensed therapist or mental-health professional. If
          something feels urgent, please reach out to local emergency services or a trusted
          person.
        </p>
      </div>
    </div>
  );
}
