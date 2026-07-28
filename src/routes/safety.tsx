import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & responsible use — Cyrano" },
      { name: "description", content: "How Cyrano handles safety, emotional distress, and situations that need real-world support." },
      { property: "og:title", content: "Safety & responsible use — Cyrano" },
      { property: "og:description", content: "Cyrano is coaching, not therapy. Here's how we handle sensitive moments." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Safety,
});

function Safety() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl">Safety & responsible use</h1>
        </div>
        <div className="prose prose-neutral mt-6 max-w-none text-sm text-foreground">
          <p className="text-muted-foreground">
            Cyrano is your dating site assistant and AI dating and relationship coach. It
            provides AI-powered coaching and educational guidance only. It is not a
            substitute for licensed mental-health care, medical advice, legal advice,
            crisis services, or emergency services.
          </p>
          <h2 className="mt-8 font-serif text-xl">If you're in immediate danger</h2>
          <p>Stop chatting with Cyrano and contact local emergency services. In the United States that's <strong>911</strong>. Move to a safe public place if you can do so safely.</p>
          <h2 className="mt-6 font-serif text-xl">Thoughts of self-harm or suicide</h2>
          <p>Please reach out to a crisis service. In the United States you can call or text <strong>988</strong>. If you're outside the US, please use your country's crisis line. Try to reach a trusted person and step away from anything that could cause harm.</p>
          <h2 className="mt-6 font-serif text-xl">Abuse, stalking, or violence</h2>
          <p>Abuse, threats, and stalking are never acceptable, and they're not your fault. Cyrano will always prioritize your immediate safety over conversation strategy, and won't recommend confrontation that could escalate danger. Consider reaching out to a trusted person or a qualified support organization.</p>
          <h2 className="mt-6 font-serif text-xl">What Cyrano won't help with</h2>
          <ul>
            <li>Deceiving, humiliating, or manipulating anyone.</li>
            <li>Contacting someone who's asked for space.</li>
            <li>Impersonation, harassment, or coercion.</li>
            <li>Diagnosing anyone with mental-health conditions from messages or profiles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
