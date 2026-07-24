import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Cyrano" },
      { name: "description", content: "How Cyrano stores, protects, and lets you delete your data." },
      { property: "og:title", content: "Privacy — Cyrano" },
      { property: "og:description", content: "Private by design. You can delete anything, anytime." },
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
        <h1 className="mt-10 font-serif text-3xl">Privacy</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This is a placeholder privacy policy. Your chats, screenshots, connections, and
          journal entries are stored only in your account. You can delete anything at any
          time, including your entire account. We encourage you to obscure names, phone
          numbers, workplaces, and other identifying details before uploading.
        </p>
      </div>
    </div>
  ),
});
