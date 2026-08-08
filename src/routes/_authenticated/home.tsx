import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MessageCircle, Feather, Image as ImageIcon, UserCheck, BookOpen, Users, ArrowRight, Sparkle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Cyrano" },
      { name: "description", content: "Ask Cyrano for help with dating conversations, profiles, and connections." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Home,
});

const features = [
  {
    to: "/help-me-reply",
    icon: MessageCircle,
    title: "Help Me Reply",
    body: "Get natural, respectful reply suggestions based on the message you received and what you want to happen next.",
  },
  {
    to: "/conversation-starter",
    icon: Feather,
    title: "Help Me Get the Conversation Started",
    body: "Start a dating-app conversation using something specific from their profile without sounding generic, cheesy, or overly clever.",
  },
  {
    to: "/screenshots",
    icon: ImageIcon,
    title: "Read a Conversation",
    body: "Upload screenshots or paste a conversation to understand the tone, context, and possible next step.",
  },
  {
    to: "/profile-review",
    icon: UserCheck,
    title: "Review a Profile",
    body: "Upload your own profile or one from a person you're connected with for practical feedback on photos, bio, prompts, and tone.",
  },
  {
    to: "/journal",
    icon: BookOpen,
    title: "My Journal",
    body: "Privately reflect on dating experiences, communication, feelings, boundaries, and lessons learned.",
  },
  {
    to: "/connections",
    icon: Users,
    title: "My Connections",
    body: "Keep the full history of each connection in one private place so Cyrano can give more relevant advice over time.",
  },
] as const;

function Home() {
  const [name, setName] = useState<string>("");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { name?: string; full_name?: string } | undefined;
      setName(meta?.name || meta?.full_name || data.user?.email?.split("@")[0] || "");
    });
  }, []);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const target = `/coach?q=${encodeURIComponent(question)}`;
    window.location.href = target;
  }

  return (
    <div className="space-y-8">
      <section className="soft-card flex min-h-[calc(100dvh-5rem)] flex-col justify-center p-6 md:min-h-[calc(100dvh-6rem)] md:p-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {greeting()}{name ? `, ${name}` : ""}
        </p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Cyrano — your dating app assistant
        </p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">What can I help you with?</h1>
        <form onSubmit={ask} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Cyrano anything…"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-xs sm:placeholder:text-sm focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-95"
          >
            Ask Cyrano <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Free plan: 10 AI messages per day. <Link to="/pricing" className="text-primary hover:underline">Upgrade for unlimited</Link>.
        </p>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="soft-card group flex gap-4 p-5 transition hover:shadow-lift"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="soft-card p-6">
        <div className="flex items-center gap-2">
          <Sparkle className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg">Upgrade to Premium</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlimited coaching, unlimited connections, pattern insights, and Write Like Me
          personalization.
        </p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          See plans
        </Link>
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
