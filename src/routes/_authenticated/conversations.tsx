import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/conversations")({
  head: () => ({ meta: [{ title: "History — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Conversation History</h1>
      <p className="text-muted-foreground">Your past chats, analyses, and suggestions will live here.</p>
    </div>
  ),
});
