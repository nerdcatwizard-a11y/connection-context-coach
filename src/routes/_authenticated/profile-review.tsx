import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/profile-review")({
  head: () => ({ meta: [{ title: "Profile Review — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Review My Profile</h1>
      <p className="text-muted-foreground">Practical feedback on your photos, bio, and prompts — coming in Phase 2.</p>
    </div>
  ),
});
