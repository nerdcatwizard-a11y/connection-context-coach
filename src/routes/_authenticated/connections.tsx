import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({ meta: [{ title: "Connections — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">My Connections</h1>
      <p className="text-muted-foreground">Private records for each person you're dating, matched with, or considering — coming in Phase 3.</p>
    </div>
  ),
});
