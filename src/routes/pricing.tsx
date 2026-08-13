import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkle } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cyrano" },
      { name: "description", content: "Simple pricing for Cyrano, your dating assistant and AI dating coach. Start free, upgrade when you need more." },
      { property: "og:title", content: "Pricing — Cyrano" },
      { property: "og:description", content: "Start free, upgrade when you need more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>
        <h1 className="mt-10 font-serif text-4xl">Simple pricing</h1>
        <p className="mt-2 text-muted-foreground">Start free. Upgrade whenever you need more.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Plan
            name="Free"
            price="$0"
            note="forever"
            features={[
              "10 AI coaching messages per day",
              "3 screenshot analyses per month",
              "1 dating profile review per month",
              "2 active connections",
              "Journal + basic chat history",
            ]}
            cta="Get started"
            to="/auth"
          />
          <Plan
            name="Premium"
            price="$14"
            note="per month, or $9/mo billed annually"
            highlight
            features={[
              "Unlimited AI coaching & replies",
              "Unlimited screenshot analysis",
              "Unlimited profile reviews",
              "Unlimited connections + full timelines",
              "Pattern insights & health overviews",
              "Write Like Me personalization",
              "Full journal search + opt-in insights",
            ]}
            cta="Start Premium"
            to="/auth"
          />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Prices are placeholders and will finalize at launch.
        </p>
      </div>
    </div>
  );
}

function Plan({ name, price, note, features, cta, to, highlight }: {
  name: string; price: string; note: string; features: string[]; cta: string; to: string; highlight?: boolean;
}) {
  return (
    <div className={`soft-card p-6 ${highlight ? "ring-2 ring-primary" : ""}`}>
      <h2 className="font-serif text-2xl">{name}</h2>
      <p className="mt-2"><span className="font-serif text-4xl">{price}</span> <span className="text-sm text-muted-foreground">{note}</span></p>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium ${
          highlight ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
