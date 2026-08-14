# Fix native Google/Apple sign-in ("missing OAuth secret")

## Why the error happens

There are two different sign-in paths in this app:

- **Web** (`/auth` in a browser) uses Lovable's managed OAuth broker. It works today because Lovable supplies the Google/Apple credentials behind the scenes.
- **Native** (the iOS/Android Capacitor build) calls the backend's Auth service directly, because the managed broker has no native equivalent. That path uses whatever Google/Apple credentials are stored in **your** backend Auth settings.

Right now the native path has no Google client secret stored, so the backend rejects it with `Unsupported provider: missing OAuth secret`. This is a configuration gap, not a code bug — nothing in the app code needs to change to fix it.

## Important security note first

The Apple client-secret JWT was pasted into chat in plain text. Chat is not a secure channel. Before shipping, regenerate that secret in the Apple Developer console (or via the Generate Secret form in the backend Auth settings) and use the new value. The Google client ID and secret were sent as secure secret references, so those are fine.

Also note: the Google/Apple credentials must be entered in the backend's **Auth settings**, not stored as app secrets. Secrets in the project secret store are for your own server code — the Auth service does not read them.

## Steps

### 1. Enter your Google credentials in the backend

In the backend view: **Users → Authentication Settings → Sign In Methods → Google**

- Switch to "Use your own credentials"
- Paste your Google client ID and client secret
- Copy the **callback URL** shown on that screen

Then in the Google Cloud console, under your OAuth client's **Authorized redirect URIs**, add that exact callback URL. Without it Google rejects the round trip with a redirect mismatch.

### 2. Enter your Apple credentials in the backend

Same screen, **Apple** section:

- Client ID: `com.nerdcatwizard.cyrano.web` (your Services ID)
- Client Secret: the **newly regenerated** JWT

In the Apple Developer console, on that Services ID under "Sign In with Apple → Configure", add the same backend callback URL as a Return URL, plus your published domain.

Apple secrets expire after six months (Apple's maximum) — set yourself a reminder to regenerate.

### 3. Add the native deep-link redirect to the allowed list

In the backend: **Users → Authentication Settings → URL Configuration → Redirect URLs**

Add:

```text
com.nerdcatwizard.cyrano://auth-callback
```

This is what lets the backend accept the native app's `redirectTo` value. Without it, the round trip fails with a redirect-not-allowed error even after the credentials are correct.

Also confirm these are present for the web path:

```text
https://connection-context-coach.lovable.app
https://connection-context-coach.lovable.app/**
```

### 4. Verify

- **Web:** sign in with Google in the preview — should behave exactly as before (managed broker, unaffected by the above).
- **Native:** after `npx cap sync`, tap "Continue with Google" on a device or simulator. The system browser should open, Google should accept the redirect, and the app should return to the dashboard signed in. Same for Apple.

## Apple App Store note

Apple requires **native** Sign in with Apple for App Store approval when other third-party sign-in is offered. The system-browser flow above works for Android and for testing on iOS, but before submission the iOS build needs a native Apple sign-in plugin. That is a separate follow-up, not part of this fix.

## What changes in code

Nothing. All four steps are backend configuration. The native OAuth code, deep-link listener, URL scheme registration in `Info.plist` and `AndroidManifest.xml`, and the web broker path are already correct and were verified.
