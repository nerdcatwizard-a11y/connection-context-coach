import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Cyrano" },
      { name: "description", content: "How Cyrano collects, uses, stores, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Cyrano" },
      { property: "og:description", content: "How Cyrano collects, uses, stores, and protects your personal information." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>

        <h1 className="mt-10 font-serif text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 15, 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none text-sm text-foreground">
          <p className="text-muted-foreground">
            Cyrano ("we", "us", "our") provides an AI-powered dating and relationship coaching service. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website or mobile application.
          </p>

          <h2 className="mt-8 font-serif text-xl">1. Information we collect</h2>
          <ul>
            <li><strong>Account information</strong> — your email address, password, and any optional details you choose to share during onboarding.</li>
            <li><strong>Content you provide</strong> — messages, screenshots, photos, dating profile reviews, journal entries, connection details, and any other information you share with Cyrano to get coaching.</li>
            <li><strong>Usage information</strong> — how you interact with the app, which features you use, and error logs that help us improve the service.</li>
            <li><strong>Device information</strong> — your device type, operating system, and app version.</li>
          </ul>

          <h2 className="mt-6 font-serif text-xl">2. How we use your information</h2>
          <ul>
            <li>To provide coaching responses and personalized advice based on the context you share.</li>
            <li>To maintain your account, connections, journal, and conversation history.</li>
            <li>To improve the app, fix bugs, and understand feature usage.</li>
            <li>To communicate with you about your account, security updates, or support requests.</li>
          </ul>

          <h2 className="mt-6 font-serif text-xl">3. AI processing</h2>
          <p>
            Cyrano uses third-party AI providers to process your inputs and generate responses. We do not allow these providers to use your conversations to train their models. We also ask you not to share sensitive personal details such as full names, addresses, phone numbers, workplaces, financial information, or government identifiers with Cyrano.
          </p>

          <h2 className="mt-6 font-serif text-xl">4. Data storage and security</h2>
          <p>
            Your data is stored in secure cloud services with access limited to authorized personnel. We use encryption in transit and at rest, and we follow industry-standard practices to protect your information. No online service is completely secure, so we encourage you to use a strong, unique password and avoid sharing sensitive details in your conversations.
          </p>

          <h2 className="mt-6 font-serif text-xl">5. Your choices and rights</h2>
          <ul>
            <li>You can review, edit, or delete your data within the app at any time.</li>
            <li>You can delete your account and all associated data from the Account settings.</li>
            <li>You can choose not to answer optional onboarding questions or upload optional screenshots.</li>
          </ul>

          <h2 className="mt-6 font-serif text-xl">6. Data retention</h2>
          <p>
            We keep your data for as long as your account is active. When you delete your account, we remove your data from active systems within a reasonable time and only retain what is necessary for legal or security purposes.
          </p>

          <h2 className="mt-6 font-serif text-xl">7. Children's privacy</h2>
          <p>
            Cyrano is not intended for users under 18 years old. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us so we can delete it.
          </p>

          <h2 className="mt-6 font-serif text-xl">8. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date above or by providing notice through the app.
          </p>

          <h2 className="mt-6 font-serif text-xl">9. Contact us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at{" "}
            <a href="mailto:nerdcatwizard@gmail.com" className="text-primary underline">
              nerdcatwizard@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
