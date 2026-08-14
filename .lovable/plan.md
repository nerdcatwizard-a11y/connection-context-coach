# Making "Continue with Google/Apple" work in the iOS/Android build

## Yes — there is a much cheaper way

The deep-link approach (custom scheme + `appUrlOpen` listener + browser plugin + Info.plist/Manifest edits + backend allow-list) works, but it is the most moving parts. There is a lighter option that removes almost all of it.

**Option A — point the native webview at the published site (recommended first).**
Set `server.url` in `capacitor.config.ts` to `https://connection-context-coach.lovable.app`. The webview then runs on a real https origin instead of `capacitor://localhost`, so Google and Apple sign-in behave exactly as they do on the phone's browser today: same managed Lovable OAuth call, same `window.location.origin` redirect, no deep links, no new plugins, no native config, no allow-list changes. Zero auth code changes.

Trade-offs, honestly:
- Needs a network connection to launch (already true — every AI feature calls the API).
- Native plugins (camera, clipboard, push) still work normally.
- App Store review can reject apps that are only a website wrapper. Cyrano ships native camera/clipboard/photo features, which usually satisfies that bar, but it is a real risk.

**Option B — bundled assets + deep links (fallback if review pushes back).**
Only needed if you must ship the web assets inside the binary. This is the full build described below.

## Option A: what gets changed

1. `capacitor.config.ts` — add a `server` block pointing at the published URL (kept overridable so `bun run dev` still works against local).
2. Nothing in the auth code. `src/routes/auth.tsx` and the managed Lovable OAuth client stay as they are.
3. Confirm Google and Apple providers are enabled on the backend for the published domain.

Effort: one file. Web behaviour: untouched.

## Option B: what gets built (if needed later)

1. Native detection helper using `Capacitor.isNativePlatform()`, branching every sign-in path; web untouched.
2. Native OAuth opens the provider in the **system browser** via `@capacitor/browser` (Google blocks embedded webviews with `disallowed_useragent`), with `redirectTo` set to `com.nerdcatwizard.cyrano://auth-callback`. Note: `capacitor://localhost/` is not a registered OS scheme and will not reliably reach `appUrlOpen` — that part of the original request needs changing.
3. `@capacitor/app` deep-link listener registered once in the root route: parses `access_token`/`refresh_token` (or PKCE `code`), calls `supabase.auth.setSession` / `exchangeCodeForSession`, closes the browser, routes to `/home`, toasts on failure.
4. Register the scheme in `ios/App/App/Info.plist` and `android/app/src/main/AndroidManifest.xml`, and add it to the backend redirect allow-list.

## Apple, either way

Apple requires native Sign in with Apple for App Store approval when other third-party sign-in is offered. Both options above use the web flow, which is fine for testing and Android; native Apple sign-in is a separate follow-up needing an Apple Developer account.

## Verification

- Web sign-in (Google, Apple, email) unchanged in preview.
- Native round trip can only be confirmed on a device/simulator after `npx cap sync`.

## Recommendation

Start with Option A. It is one config line versus a subsystem, and it makes both buttons work immediately on device. Move to Option B only if you decide the app must run from bundled assets.
