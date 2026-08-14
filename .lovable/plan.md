# Native Google & Apple Sign-In for the iOS/Android build

## Short answer to your question

The overall approach — detect native, use a different redirect, listen for the deep link, set the session — is right. One part of it is not: **`capacitor://localhost/` should not be the redirect target.**

- `capacitor://localhost` is the internal origin the webview serves files from on iOS. It is not a URL scheme registered with the OS, so a redirect from Google or Apple back to it is not reliably delivered to `appUrlOpen`.
- Google blocks OAuth inside an embedded webview (`disallowed_useragent`). Sign-in must open in the system browser (SFSafariViewController / Chrome Custom Tabs), not in the app's webview.

What actually works on device: open the provider in the system browser, come back through a **registered custom scheme** (`com.nerdcatwizard.cyrano://auth-callback`) or a Universal Link on the published domain, then hand the returned tokens to the auth client.

Everything else in your list stays — it just points at a real scheme instead of `capacitor://localhost`.

## What gets built

1. **Native detection helper** — a small module that reports whether the app is running natively (via `Capacitor.isNativePlatform()`), used to branch every sign-in path. Web behaviour is untouched.

2. **Native OAuth path for Google and Apple** — on native, sign-in opens the provider URL in the system browser via `@capacitor/browser` with `redirectTo` set to `com.nerdcatwizard.cyrano://auth-callback`. On web, the existing popup flow through the managed Lovable auth client stays exactly as it is today.

3. **Deep link listener** — registered once at app startup (in the root route, which is this project's equivalent of `main.tsx`). It handles `appUrlOpen`, parses `access_token`/`refresh_token` (or the PKCE `code`) out of the returned URL, calls `supabase.auth.setSession` (or `exchangeCodeForSession`), closes the in-app browser, and routes the user to `/home`. Failures surface as a toast instead of a silent hang.

4. **Native project configuration** — register the URL scheme in `ios/App/App/Info.plist` and `android/app/src/main/AndroidManifest.xml`, and add the scheme to the backend's allowed redirect URLs so the provider will accept it.

5. **Apple on iOS** — Apple requires native Sign in with Apple for App Store approval when third-party sign-in is offered. The browser-based flow above works for testing and for Android; the plan notes native Apple as a follow-up that needs an Apple Developer account and a Capacitor Apple sign-in plugin.

## Verification

- Web sign-in (Google, Apple, email) still works in the preview — this is the regression risk and gets checked first.
- Native path is verified by build plus code review here; the round trip through the system browser can only be confirmed on a real device or simulator after `npx cap sync`.

## Technical notes

- Uses `@capacitor/app` and `@capacitor/browser` (the latter needs installing).
- Redirect scheme: `com.nerdcatwizard.cyrano://auth-callback`, matching the existing `appId`.
- The managed Lovable auth client is popup/`web_message`-based and is kept for web only. The native path calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })` and opens the returned URL itself, so the redirect target is under our control.
- The custom scheme must be added to the backend's allowed redirect URL list, otherwise the provider rejects it.

## Not included

- Apple Developer account setup, provisioning profiles, or store submission.
- Universal Links (needs an `apple-app-site-association` file on the published domain); the custom scheme is simpler and sufficient.
