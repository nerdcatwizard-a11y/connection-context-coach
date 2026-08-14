# Native Google & Apple Sign-In (bundled app, deep-link callback)

Understood — the app stays a real native build with bundled assets calling the API cross-origin. No webview-pointed-at-the-website shortcut. That means the sign-in buttons need a proper native OAuth round trip.

## Answer to your original question

The structure you described is correct — detect native, use a different redirect, listen for the deep link, set the session. Two details have to change or it will not work on device:

- **`capacitor://localhost/` is the wrong redirect target.** It is the internal origin the iOS webview serves files from, not a URL scheme registered with the OS, so a provider redirect to it is not reliably delivered to `appUrlOpen`.
- **Sign-in cannot run inside the app's webview.** Google rejects embedded webviews with `disallowed_useragent`. It must open in the system browser (SFSafariViewController on iOS, Chrome Custom Tabs on Android).

Fix those two and the rest of your list is exactly right.

## What gets built

1. **Native detection helper** — small module reporting `Capacitor.isNativePlatform()`. Every sign-in path branches on it; web behaviour is untouched.

2. **Native OAuth path for Google and Apple** — on native, `src/routes/auth.tsx` calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: 'com.nerdcatwizard.cyrano://auth-callback', skipBrowserRedirect: true } })`, then opens the returned URL with `@capacitor/browser` so it lands in the system browser. On web, the existing managed Lovable popup flow is unchanged.

3. **Deep-link listener** — `@capacitor/app`'s `appUrlOpen`, registered once at startup in `src/routes/__root.tsx` (this project's `main.tsx` equivalent), inside a `useEffect` so it never runs during SSR. It parses the returned URL for `access_token`/`refresh_token` or a PKCE `code`, calls `supabase.auth.setSession` / `exchangeCodeForSession`, closes the in-app browser, and navigates to `/home`. Errors surface as a toast rather than hanging on the sign-in screen.

4. **Native project config** — register `com.nerdcatwizard.cyrano` as a URL scheme in `ios/App/App/Info.plist` (`CFBundleURLTypes`) and add a matching `intent-filter` with `BROWSABLE`/`DEFAULT` to `android/app/src/main/AndroidManifest.xml` (the activity is already `singleTask`, which is what the listener needs).

5. **Backend redirect allow-list** — add the custom scheme so the provider accepts it as a valid `redirectTo`. Without this the round trip fails with a redirect-mismatch error.

## Apple specifics

Apple requires **native** Sign in with Apple for App Store approval when other third-party sign-in is offered. The browser flow above is correct for Android and fine for testing on iOS, but before submission iOS needs a native Apple sign-in plugin plus an Apple Developer account, Services ID, and key. Flagging it now so it is not a surprise at review; it is a separate follow-up, not part of this change.

## Verification

- Web sign-in (Google, Apple, email/password) still works in preview — checked first, since that is the regression risk.
- Native path: build succeeds and the code is reviewed here. The actual round trip through the system browser can only be confirmed by you on a device or simulator after `npx cap sync`.

## Technical notes

- Adds `@capacitor/browser`; `@capacitor/app` is installed with it.
- Scheme `com.nerdcatwizard.cyrano://auth-callback` matches the existing Capacitor `appId`.
- The managed Lovable auth client stays for web only — it is popup/`web_message`-based and has no native equivalent, which is why native calls the Supabase client directly.
- No changes to the API routes, CORS setup, or Bearer-token auth you already built; the session that lands from the deep link is the same JWT those calls already use.
