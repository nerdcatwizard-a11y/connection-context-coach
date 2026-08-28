import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cyrano - Dating Coach" },
      { name: "description", content: "Redirecting to sign in..." },
      { name: "robots", content: "noindex" },
    ],
  }),
  // Resolve the session BEFORE rendering so an already signed-in user never
  // sees the sign-in screen flash on a cold app launch.
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/home" : "/auth" });
  },
  component: () => null,
});

