import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUsage, useRefreshUsage } from "@/hooks/use-usage";

import {
  PREMIUM_MONTHLY_ID,
  PREMIUM_YEARLY_ID,
  getPrices,
  purchasePremium,
  restorePurchases,
  storeAvailable,
  type PremiumProductId,
} from "@/lib/iap";


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
          <PremiumPlan />
        </div>
      </div>
    </div>
  );
}

function PremiumPlan() {
  const native = storeAvailable();
  const { usage, isPremium, loading } = useUsage();
  const refreshUsage = useRefreshUsage();
  const [prices, setPrices] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<PremiumProductId | "restore" | null>(null);

  useEffect(() => {
    if (!native || isPremium) return;
    void getPrices()
      .then((list) => setPrices(Object.fromEntries(list.map((p) => [p.id, p.price]))))
      .catch(() => undefined);
  }, [native, isPremium]);

  async function buy(id: PremiumProductId) {
    if (isPremium) {
      toast.info("You're already subscribed to Cyrano Premium.");
      return;
    }
    setBusy(id);
    try {
      await purchasePremium(id);
      toast.success("Thanks! Your Premium access unlocks as soon as Apple confirms the purchase.");
      void refreshUsage();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy("restore");
    try {
      await restorePurchases();
      toast.success("Checked the App Store for previous purchases.");
      void refreshUsage();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }


  const features = [
    "Unlimited AI coaching & replies",
    "Unlimited screenshot analysis",
    "Unlimited profile reviews",
    "Unlimited connections + full timelines",
    "Pattern insights & health overviews",
    "Write Like Me personalization",
    "Full journal search + opt-in insights",
  ];

  if (!loading && isPremium) {
    return (
      <div className="soft-card p-6 ring-2 ring-primary">
        <h2 className="font-serif text-2xl">You're on Cyrano Premium</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything is unlocked — unlimited coaching, replies, analysis and profile reviews.
        </p>
        <ul className="mt-5 space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          Manage or cancel in device Settings &gt; Apple ID &gt; Subscriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="soft-card p-6 ring-2 ring-primary">
      <h2 className="font-serif text-2xl">Cyrano Premium</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Auto-renewable subscription — 1 month or 1 year
      </p>
      <p className="mt-2">
        <span className="font-serif text-4xl">{prices[PREMIUM_MONTHLY_ID] ?? "$14"}</span>{" "}
        <span className="text-sm text-muted-foreground">
          per month, or {prices[PREMIUM_YEARLY_ID] ?? "$108"} per year
        </span>
      </p>
      {usage && (
        <p className="mt-2 text-xs text-muted-foreground">
          Free plan today: {usage.chat.remaining} of {usage.chat.limit} chat messages and{" "}
          {usage.pickup.remaining} of {usage.pickup.limit} pickup line generations left.
        </p>
      )}
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {native ? (

        <div className="mt-6 space-y-2">
          <button
            onClick={() => void buy(PREMIUM_MONTHLY_ID)}
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy === PREMIUM_MONTHLY_ID ? "Opening App Store…" : "Subscribe monthly"}
          </button>
          <button
            onClick={() => void buy(PREMIUM_YEARLY_ID)}
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            {busy === PREMIUM_YEARLY_ID ? "Opening App Store…" : "Subscribe yearly (save 35%)"}
          </button>
          <button
            onClick={() => void restore()}
            disabled={busy !== null}
            className="w-full py-1 text-xs text-muted-foreground underline disabled:opacity-60"
          >
            Restore purchases
          </button>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Payment is charged to your Apple ID at confirmation of purchase. The subscription
            renews automatically at the same price and period unless auto-renew is turned off at
            least 24 hours before the period ends. Manage or cancel in your device Settings &gt;
            Apple ID &gt; Subscriptions.
          </p>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-accent/60 p-4 text-sm text-muted-foreground">
          Premium is purchased inside the Cyrano app for iPhone or Android through your App Store
          account. Open the app and tap Upgrade to subscribe or restore a purchase.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        <Link to="/terms" className="underline">
          Terms of Use (EULA)
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}


function Plan({ name, price, note, features, cta, to }: {
  name: string; price: string; note: string; features: string[]; cta: string; to: string;
}) {
  return (
    <div className="soft-card p-6">
      <h2 className="font-serif text-2xl">{name}</h2>
      <p className="mt-2">
        <span className="font-serif text-4xl">{price}</span>{" "}
        <span className="text-sm text-muted-foreground">{note}</span>
      </p>
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
        className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
      >
        {cta}
      </Link>
    </div>
  );
}
