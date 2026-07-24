import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/profile-review")({
  head: () => ({ meta: [{ title: "Review a Profile — Cyrano" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Review a Profile</h1>
      <p className="text-muted-foreground">Upload your own profile or one from a person you're connected with for practical feedback on photos, bio, and prompts — coming in Phase 2.</p>
    </div>
  ),
});
