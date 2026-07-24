import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/screenshots")({
  head: () => ({ meta: [{ title: "Read a Conversation — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Read a Conversation</h1>
      <p className="text-muted-foreground">Upload screenshots to understand tone and possible next steps — coming in Phase 2.</p>
    </div>
  ),
});
