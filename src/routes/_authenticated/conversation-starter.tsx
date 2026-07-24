import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/conversation-starter")({
  head: () => ({ meta: [{ title: "Conversation Starter — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Help Me Get the Conversation Started</h1>
      <p className="text-muted-foreground">Share what you noticed about their profile and Cyrano will suggest openers grounded in something real — coming in Phase 2.</p>
    </div>
  ),
});
