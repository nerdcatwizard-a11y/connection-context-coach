import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle, Mail } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Cyrano" },
      { name: "description", content: "Get help with Cyrano. Contact support via email or browse common questions." },
      { property: "og:title", content: "Support — Cyrano" },
      { property: "og:description", content: "Get help with Cyrano. Contact support via email or browse common questions." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

function Support() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>

        <h1 className="mt-10 font-serif text-3xl">Support</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Need help with Cyrano? We're here for you. Reach out by email and we'll get back to you as soon as possible.
        </p>

        <a
          href="mailto:nerdcatwizard@gmail.com"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Mail className="h-4 w-4" />
          nerdcatwizard@gmail.com
        </a>

        <div className="mt-10 space-y-6">
          <div>
            <h2 className="font-serif text-xl">Forgot your password?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the "Email me a sign-in link" option on the sign-in screen, or the reset-password flow from the sign-in page.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">How do I delete my data?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You can delete individual conversations, journal entries, and connections from within each feature. To delete your entire account and all data, go to <strong>Account</strong> in the app and follow the delete-account steps.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">Is my data private?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yes. Your data is stored in your account and is not shared with other users. Read our{" "}
              <Link to="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">Is Cyrano a therapist or crisis service?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No. Cyrano is a dating and relationship coaching assistant. It is not a substitute for licensed mental-health care, medical advice, or emergency services. If you're in immediate danger, please contact local emergency services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
