import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Cyrano" },
      { name: "description", content: "Terms of service for using Cyrano." },
      { property: "og:title", content: "Terms — Cyrano" },
      { property: "og:description", content: "Placeholder terms of service for Cyrano." },
      { property: "og:type", content: "article" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>
        <h1 className="mt-10 font-serif text-3xl">Terms</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Placeholder terms of service. By using Cyrano you acknowledge that it provides
          coaching and educational guidance only and is not a licensed mental-health,
          medical, legal, or crisis service.
        </p>
      </div>
    </div>
  ),
});
