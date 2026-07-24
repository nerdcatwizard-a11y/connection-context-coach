import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">My Journal</h1>
      <p className="text-muted-foreground">A private space to reflect on dating, feelings, and patterns — coming in Phase 4.</p>
    </div>
  ),
});
