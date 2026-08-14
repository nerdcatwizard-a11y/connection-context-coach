import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sparkle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { isNative } from "@/lib/native";
import { signInWithOAuthNative } from "@/lib/native-auth";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Cyrano" },
      { name: "description", content: "Sign in to Cyrano, your dating assistant and AI dating coach." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < 8) problems.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) problems.push("One uppercase letter");
  if (!/[a-z]/.test(pw)) problems.push("One lowercase letter");
  if (!/[0-9]/.test(pw)) problems.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw)) problems.push("One special character (e.g. ! ? @ #)");
  return problems;
}

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const [busy, setBusy] = useState(false);

  const problems = passwordProblems(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const signupReady = mode === "signin" || (problems.length === 0 && passwordsMatch);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      navigate({ to: "/home", replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      setBusy(false);
      toast.dismiss();
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);




  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "");
    const submittedPassword = String(formData.get("password") ?? "");
    const submittedConfirmation = String(formData.get("confirmPassword") ?? "");
    const normalizedEmail = submittedEmail.trim().toLowerCase();
    const submittedProblems = passwordProblems(submittedPassword);

    setEmail(normalizedEmail);
    setPassword(submittedPassword);
    if (mode === "signup") setConfirmPassword(submittedConfirmation);

    if (mode === "signup") {
      setTouchedPassword(true);
      if (submittedProblems.length > 0) {
        toast.error("Please fix your password: " + submittedProblems.join(", ").toLowerCase());
        return;
      }
      if (submittedPassword !== submittedConfirmation) {
        toast.error("Passwords don't match.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: submittedPassword,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        const identities = data.user?.identities ?? [];
        if (identities.length === 0) {
          toast.info("That email already has an account. Sign in, or use Forgot password if needed.");
          setMode("signin");
          return;
        }

        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: submittedPassword,
          });
          if (signInError) throw signInError;
        }

        const { data: created, error: createdError } = await supabase.auth.getUser();
        if (createdError || !created.user) {
          throw new Error("Account created, but we couldn't start your session. Please sign in.");
        }

        toast.success("Welcome to Cyrano!");
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: submittedPassword,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error("The backend did not accept this password. Reset it below to create and verify a new password, then update the one saved on your phone.");
          }
          throw error;
        }
        const { data: verified, error: verificationError } = await supabase.auth.getUser();
        if (verificationError || !verified.user) {
          throw new Error("You signed in, but the session could not be verified. Please try again.");
        }
        navigate({ to: "/home", replace: true });
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
      if (isNative()) {
        // Native: open the provider in the system browser and let the
        // appUrlOpen deep-link listener finish the sign in.
        await signInWithOAuthNative(provider);
        setBusy(false);
        return;
      }

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

  if (signedUpEmail) {
    return (
      <div className="min-h-screen gradient-hero">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkle className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl">Cyrano</span>
          </Link>

          <div className="mt-8 w-full soft-card p-6 text-center">
            <h1 className="font-serif text-2xl">Thank You!</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please check your email to confirm your account.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{signedUpEmail}</span>.
              Check your spam folder if you don't see it. After confirming, come back here and sign in.
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-5 w-full rounded-xl border border-dashed border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {resending ? "Resending..." : "Didn't get the email? Resend confirmation"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSignedUpEmail(null);
                setMode("signin");
                setPassword("");
                setConfirmPassword("");
              }}
              className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
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
            Cyrano — your dating assistant
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
            <label htmlFor="signin-email" className="sr-only">Email address</label>
            <input
              id="signin-email"
              type="email"
              required
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@example.com"
              onInput={(e) => setEmail(e.currentTarget.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="relative">
              <label htmlFor="signin-password" className="sr-only">Password</label>
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                name="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Password"
                onInput={(e) => setPassword(e.currentTarget.value)}
                onBlur={() => setTouchedPassword(true)}
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

            {mode === "signup" && (
              <>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="confirmPassword"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Repeat password"
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <ul className="space-y-1 rounded-xl bg-muted/50 p-3 text-xs">
                  {[
                    { label: "At least 8 characters", ok: password.length >= 8 },
                    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
                    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
                    { label: "One number", ok: /[0-9]/.test(password) },
                    {
                      label: "One special character (e.g. ! ? @ #)",
                      ok: /[^A-Za-z0-9]/.test(password),
                    },
                    {
                      label: "Both passwords match",
                      ok: passwordsMatch,
                    },
                  ].map((rule) => (
                    <li
                      key={rule.label}
                      className={
                        rule.ok
                          ? "text-foreground"
                          : touchedPassword || password.length > 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {rule.ok ? "✓" : "•"} {rule.label}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button
              type="submit"
              disabled={busy || !signupReady}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => navigate({ to: "/reset-password", search: { email: email.trim().toLowerCase() || undefined } })}
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                Reset and verify my password
              </button>
            )}

          </form>


          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="hover:text-foreground">
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
            <Link to="/reset-password" className="hover:text-foreground">
              Forgot password?
            </Link>
          </div>

        </div>

        <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
          I'm Cyrano, your dating assistant and AI dating and relationship coach. I
          can offer educational guidance and help you think through dating
          situations, but I'm not a licensed therapist or mental-health professional. If
          something feels urgent, please reach out to local emergency services or a trusted
          person.
        </p>
      </div>
    </div>
  );
}
