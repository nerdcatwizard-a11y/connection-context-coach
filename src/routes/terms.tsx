import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";

const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use (EULA) — Cyrano" },
      {
        name: "description",
        content:
          "Terms of Use and end user license agreement for Cyrano, including auto-renewable subscription terms.",
      },
      { property: "og:title", content: "Terms of Use (EULA) — Cyrano" },
      {
        property: "og:description",
        content: "Terms of Use, subscription terms, and license agreement for Cyrano.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://connection-context-coach.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://connection-context-coach.lovable.app/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Cyrano</span>
        </Link>

        <h1 className="mt-10 font-serif text-3xl">Terms of Use (EULA)</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 16, 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none text-sm text-foreground">
          <p className="text-muted-foreground">
            These Terms of Use ("Terms") are a legal agreement between you and Cyrano ("we", "us",
            "our") governing your use of the Cyrano website and mobile application (the "Service").
            By creating an account or using the Service, you agree to these Terms. If you do not
            agree, please do not use the Service.
          </p>

          <h2 className="mt-8 font-serif text-xl">1. Eligibility</h2>
          <p>
            You must be at least 18 years old to use Cyrano. By using the Service you confirm that
            you are 18 or older and legally able to enter into this agreement.
          </p>

          <h2 className="mt-8 font-serif text-xl">2. What Cyrano is — and is not</h2>
          <p>
            Cyrano is an AI-powered dating and relationship coaching assistant. It offers
            educational guidance, suggested replies, and reflection prompts.
          </p>
          <p>
            <strong>
              Cyrano is not a licensed therapist, counselor, physician, lawyer, or crisis service.
            </strong>{" "}
            Nothing in the Service is medical, psychological, or legal advice. If you are in danger
            or experiencing a mental-health emergency, contact your local emergency number (911 in
            the US) or a crisis line such as 988 (US Suicide &amp; Crisis Lifeline).
          </p>
          <p>
            AI output can be inaccurate, incomplete, or inappropriate for your situation. You are
            responsible for deciding what to say and do. Use your own judgment.
          </p>

          <h2 className="mt-8 font-serif text-xl">3. Your account</h2>
          <p>
            You are responsible for keeping your login credentials secure and for all activity under
            your account. Tell us right away if you believe your account has been compromised. You
            can delete your account and its data at any time from the Account screen in the app.
          </p>

          <h2 className="mt-8 font-serif text-xl">4. Subscriptions and billing</h2>
          <p>
            Cyrano offers a free tier with usage limits and an optional paid subscription, Cyrano
            Premium, which unlocks unlimited coaching, replies, screenshot reads, profile reviews,
            and connections.
          </p>
          <ul>
            <li>
              <strong>Title and length:</strong> Cyrano Premium is available as an auto-renewable
              monthly subscription (1 month) or an auto-renewable yearly subscription (1 year).
            </li>
            <li>
              <strong>Price:</strong> the current price for your region is always shown on the
              purchase screen before you confirm. Prices may change with notice; changes never apply
              to a period you have already paid for.
            </li>
            <li>
              <strong>Payment:</strong> payment is charged to your Apple ID (or Google Play) account
              at confirmation of purchase.
            </li>
            <li>
              <strong>Auto-renewal:</strong> subscriptions renew automatically at the same price and
              period unless auto-renew is turned off at least 24 hours before the end of the current
              period. Your account is charged for renewal within 24 hours prior to the end of the
              current period.
            </li>
            <li>
              <strong>Managing or cancelling:</strong> you can manage or cancel your subscription in
              your device settings — on iOS, Settings &gt; your Apple ID &gt; Subscriptions.
              Deleting the app does not cancel a subscription.
            </li>
            <li>
              <strong>Refunds:</strong> no refund is provided for the unused portion of a current
              period, except where required by law. Purchases made through the App Store are handled
              by Apple; refund requests go to Apple.
            </li>
            <li>
              <strong>Free trials or promotions,</strong> where offered, convert to a paid
              subscription unless cancelled at least 24 hours before the trial ends. Any unused
              portion of a free trial is forfeited when you purchase a subscription.
            </li>
          </ul>

          <h2 className="mt-8 font-serif text-xl">5. Acceptable use</h2>
          <p>You agree not to use Cyrano to:</p>
          <ul>
            <li>harass, stalk, deceive, manipulate, coerce, or harm another person;</li>
            <li>impersonate someone else or create content intended to defraud;</li>
            <li>upload content involving minors in any sexual or romantic context;</li>
            <li>upload other people's private information without a lawful basis;</li>
            <li>generate sexually explicit, hateful, violent, or otherwise abusive content;</li>
            <li>
              reverse engineer, scrape, resell, or attempt to bypass usage limits or security
              controls of the Service.
            </li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these rules, without refund where
            permitted by law.
          </p>

          <h2 className="mt-8 font-serif text-xl">6. Your content</h2>
          <p>
            You keep ownership of the messages, screenshots, journal entries, and other content you
            submit. You grant us a limited license to process that content solely to operate and
            improve the Service for you — for example, sending it to our AI provider to generate a
            response. See the{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            for details on how your data is handled.
          </p>

          <h2 className="mt-8 font-serif text-xl">7. License</h2>
          <p>
            We grant you a personal, non-exclusive, non-transferable, revocable license to use the
            Cyrano app on devices you own or control, for your personal, non-commercial use, in
            accordance with these Terms and the usage rules of the applicable app store.
          </p>

          <h2 className="mt-8 font-serif text-xl">8. Apple standard EULA</h2>
          <p>
            If you obtained Cyrano through the Apple App Store, Apple's Licensed Application End
            User License Agreement also applies to your use of the app, and these Terms supplement
            it. You can read it here:{" "}
            <a href={APPLE_EULA} target="_blank" rel="noreferrer" className="underline">
              Apple Standard EULA
            </a>
            . Apple is not responsible for the Service or its content, and Apple has no obligation
            to furnish maintenance or support for the app.
          </p>

          <h2 className="mt-8 font-serif text-xl">9. Termination</h2>
          <p>
            You may stop using Cyrano and delete your account at any time. We may suspend or end
            your access if you breach these Terms or if we discontinue the Service.
          </p>

          <h2 className="mt-8 font-serif text-xl">10. Disclaimers</h2>
          <p>
            The Service is provided "as is" and "as available", without warranties of any kind,
            express or implied, to the fullest extent permitted by law. We do not warrant that the
            Service will be uninterrupted, error-free, or that AI output will be accurate or suitable
            for your circumstances.
          </p>

          <h2 className="mt-8 font-serif text-xl">11. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect, incidental,
            special, consequential, or punitive damages, or for any loss arising from your use of —
            or reliance on — the Service. Our total liability for any claim is limited to the amount
            you paid us in the twelve months before the claim arose.
          </p>

          <h2 className="mt-8 font-serif text-xl">12. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will update the date at the
            top of this page. Continuing to use the Service after an update means you accept the
            revised Terms.
          </p>

          <h2 className="mt-8 font-serif text-xl">13. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a href="mailto:nerdcatwizard@gmail.com" className="underline">
              nerdcatwizard@gmail.com
            </a>{" "}
            or visit our{" "}
            <Link to="/support" className="underline">
              Support
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
}
