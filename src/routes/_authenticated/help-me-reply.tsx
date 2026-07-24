import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/help-me-reply")({
  head: () => ({ meta: [{ title: "Help Me Reply — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Help Me Reply</h1>
      <p className="text-muted-foreground">Paste what you received and Cyrano will offer three natural, respectful reply options — coming in Phase 2.</p>
    </div>
  ),
});
