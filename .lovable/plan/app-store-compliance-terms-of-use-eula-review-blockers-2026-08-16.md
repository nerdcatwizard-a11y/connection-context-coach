# App Store compliance: Terms of Use (EULA) + review blockers

Apple rejected the build because an app selling auto-renewable subscriptions must show a working Terms of Use (EULA) link both in the app and in App Store Connect metadata. Two other items in the app would likely trigger a follow-up rejection, so they get fixed in the same pass.

## 1. Real Terms of Use page

`/terms` currently contains a two-sentence placeholder. Replace it with a full Terms of Use written for Cyrano, covering:

- Acceptance and eligibility (18+)
- Description of the service and the explicit "coaching/educational only, not therapy or crisis service" disclaimer
- Auto-renewable subscription terms: title, length (monthly / yearly), price shown at purchase, charged to Apple ID at confirmation, auto-renews unless cancelled at least 24 hours before period end, cancellation via device Settings, no refunds for unused portion of a period
- Acceptable use, user content and AI-output limitations
- Termination, disclaimers, limitation of liability, changes to terms, contact (nerdcatwizard@gmail.com)
- A line stating that Apple's standard EULA also applies, with a link to https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Match the existing `/privacy` page's layout and styling.

## 2. Terms links everywhere Apple expects them

- Purchase screen (`/pricing`): Terms of Use and Privacy Policy links visible in **both** the native and web branches, not just inside the native block. Keep the subscription disclosure text next to the buttons.
- Account screen: add Terms of Use, Privacy Policy, and Support links.
- App footer (`AppShell`): add "Terms" next to the existing Privacy and Support links, in both the desktop and mobile footers.
- Sign-up screen: add "By creating an account you agree to our Terms of Use and Privacy Policy" with links.
- Add `/terms` to the sitemap entry set (already present) and confirm the route is publicly reachable without auth.

## 3. Other likely review blockers

- **Account deletion (Guideline 5.1.1(v))**: the Privacy and Support pages tell users they can delete their account from Account settings, but no such control exists. Add a "Delete my account" flow on the Account screen — confirmation dialog, then a server call that removes the user's rows and deletes the auth user, then signs out.
- **Subscription metadata on the purchase screen**: ensure the subscription name, duration, and price are all rendered next to the purchase buttons before the user taps (currently price/duration are there; the plan title text gets tightened).

## What you must do in App Store Connect

The app-side link is only half of it. In App Store Connect:
- App Description: paste a link to the Terms of Use — either https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ or https://connection-context-coach.lovable.app/terms
- App Privacy Policy URL: https://connection-context-coach.lovable.app/privacy
- If using a custom EULA, paste the `/terms` text into App Information > License Agreement.

## Technical notes

Files touched: `src/routes/terms.tsx` (rewrite), `src/routes/pricing.tsx`, `src/routes/_authenticated/account.tsx`, `src/components/AppShell.tsx`, `src/routes/auth.tsx`, plus a new server function for account deletion (privileged admin client loaded inside the handler after verifying the caller). No schema changes.
