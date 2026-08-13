import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyrano - Dating Coach" },
      { name: "description", content: "Redirecting to sign in..." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
