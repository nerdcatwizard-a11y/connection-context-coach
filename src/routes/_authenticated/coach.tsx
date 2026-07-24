import { createFileRoute } from "@tanstack/react-router";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "Coach — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">AI Coach</h1>
      <CyranoDisclaimer />
      <div className="soft-card p-6 text-sm text-muted-foreground">
        Streaming chat coach is coming in Phase 2. You'll be able to start a new
        conversation, associate it with a connection, and pick up right where you left off.
      </div>
    </div>
  ),
});
