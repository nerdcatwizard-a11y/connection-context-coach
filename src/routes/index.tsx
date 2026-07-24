import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle, MessageCircle, Users, Image as ImageIcon, UserCheck, BookOpen, ShieldCheck, Feather, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyrano — Your AI dating coach, whenever you need one" },
      {
        name: "description",
        content:
          "Thoughtful, personalized help with dating-app conversations, profiles, dates, and relationships — based on the full context, not just one message.",
      },
      { property: "og:title", content: "Cyrano — Your AI dating coach" },
      {
        property: "og:description",
        content:
          "ChatGPT answers a dating question. Cyrano understands the entire connection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cyrano — Your AI dating coach" },
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkle className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg">Cyrano</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 text-primary" />
              AI dating coach — thoughtful, private, always available
            </span>
            <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
              Your AI dating coach,<br className="hidden md:block" /> whenever you need one.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Thoughtful, personalized help with dating-app conversations, profiles,
              dates, and relationships — based on the full context, not just one message.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lift hover:opacity-95"
              >
                Ask Cyrano <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to start. No dating profile required.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl soft-card p-6 md:p-8">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              What makes Cyrano different
            </p>
            <p className="mt-3 font-serif text-2xl md:text-3xl">
              “ChatGPT answers a dating question. Cyrano understands the entire connection.”
            </p>
            <p className="mt-4 text-muted-foreground">
              Cyrano organizes the people, conversations, dates, and reflections in your
              dating life — so advice is grounded in what's actually happening, not
              analyzed in isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="font-serif text-3xl md:text-4xl">Six ways Cyrano helps</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each one is designed to help you communicate more effectively while sounding
          like yourself — never cheesy, snarky, or manufactured.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={MessageCircle} title="Help me reply" body="Natural, respectful reply options based on what was said and what you actually want to happen next." />
          <Feature icon={Feather} title="Start a conversation" body="Openers that use something real from their profile — without generic greetings or forced humor." />
          <Feature icon={ImageIcon} title="Read a conversation" body="Upload screenshots to understand tone, subtext, and possible next steps." />
          <Feature icon={UserCheck} title="Review my profile" body="Practical feedback on photos, bio, and prompts that keeps your voice intact." />
          <Feature icon={Users} title="My Connections" body="Keep the full history of each connection in one private place so advice gets more relevant over time." />
          <Feature icon={BookOpen} title="Private journal" body="Reflect on dates, feelings, and patterns — never used as AI context without your permission." />
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-serif text-3xl md:text-4xl">How Cyrano works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step n="1" title="Tell Cyrano what's going on">
              Paste a message, upload a screenshot, or just describe the situation.
            </Step>
            <Step n="2" title="Get a fair, honest take and recommendations">
              Cyrano separates facts from interpretations and offers grounded next steps —
              never snarky, manipulative, or preachy.
            </Step>
            <Step n="3" title="Save context that helps later">
              Save the person, the moment, and the outcome. Cyrano gets smarter about the
              full connection, not just one message.
            </Step>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-serif text-3xl">Private by design</h2>
            <p className="mt-3 text-muted-foreground">
              Your chats, screenshots, connections, and journal entries are stored in
              your account only. You can delete anything at any time, including your
              entire account. Cyrano encourages you to obscure names, phone numbers, and
              other identifying details before uploading.
            </p>
          </div>
          <div className="soft-card p-6">
            <p className="text-sm font-medium">Cyrano is coaching, not therapy.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cyrano provides AI-powered coaching and educational guidance. It is not a
              licensed therapist, mental-health provider, medical professional, legal
              professional, crisis service, or emergency service.
            </p>
            <Link to="/safety" className="mt-4 inline-flex text-sm text-primary hover:underline">
              Read our safety approach →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 text-sm text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Sparkle className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Cyrano</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link to="/pricing">Pricing</Link>
            <Link to="/safety">Safety</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="soft-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-serif text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="soft-card p-6">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
        {n}
      </span>
      <h3 className="mt-4 font-serif text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
