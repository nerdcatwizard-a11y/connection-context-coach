import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyrano - Dating Coach" },
      {
        name: "description",
        content:
          "Thoughtful, personalized help with dating-app conversations, profiles, dates, and relationships — based on the full context, not just one message.",
      },
      { property: "og:title", content: "Cyrano - Dating Coach" },
      {
        property: "og:description",
        content:
          "ChatGPT answers a dating question. Cyrano understands the entire connection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cyrano - Dating Coach" },
      {
        name: "twitter:description",
        content:
          "Reply help, conversation starters, profile reviews, and a private space to keep track of every connection.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  // Signed-in users land on the dashboard, not the marketing page.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      setRedirecting(true);
      navigate({ to: "/home", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (redirecting) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <span className="grid h-10 w-10 animate-pulse place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkle className="h-5 w-5" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col justify-between bg-background text-foreground overflow-hidden">
      {/* Brand */}
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-primary text-primary-foreground md:h-24 md:w-24">
          <Sparkle className="h-10 w-10 md:h-12 md:w-12" />
        </span>
        <h1 className="mt-5 font-serif text-5xl md:text-6xl">Cyrano</h1>
        <p className="mt-2 text-lg text-muted-foreground md:text-xl">Your Dating App Assistant</p>
        <p className="mt-4 max-w-xl text-center text-sm text-muted-foreground md:text-base">
          Thoughtful, personalized help with dating-app conversations, profiles, dates, and relationships — based on the full context, not just one message.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lift hover:opacity-95"
          >
            <span className="flex flex-col items-center leading-tight">
              <span>Ask Cyrano</span>
              <span className="text-[10px] font-normal opacity-90">Free to Try</span>
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Free to start. No dating profile or credit card required.
        </p>
      </div>

      {/* What makes Cyrano different */}
      <div className="px-5 pb-8 md:pb-10">
        <div className="soft-card p-5 md:p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            What makes Cyrano different
          </p>
          <p className="mt-2 font-serif text-base leading-snug md:text-2xl">
            “ChatGPT answers a dating question. Cyrano understands the entire connection.”
          </p>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Cyrano organizes the people, conversations, dates, and reflections in your dating life — so advice is grounded in what's actually happening, not analyzed in isolation.
          </p>
        </div>
      </div>
    </div>
  );
}
