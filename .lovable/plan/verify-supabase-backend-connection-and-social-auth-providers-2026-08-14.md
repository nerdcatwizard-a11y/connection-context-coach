# Verify Supabase backend connection and social auth providers

## Current state
- This project is connected to Lovable Cloud-managed Supabase.
- Project ID: `ufewhsnvgkuglfrytaty`
- URL: `https://ufewhsnvgkuglfrytaty.supabase.co`
- Managed by Lovable: true
- The app already has client-side native Google/Apple OAuth flow code (`src/lib/native-auth.ts`, `src/components/NativeDeepLinkHandler.tsx`), but we need to confirm the corresponding providers are enabled in the backend Auth settings.

## What we will do

1. **Check current social auth provider configuration** in the backend for Google and Apple.
2. **Enable Google and Apple sign-in** in Supabase Auth if either is not active.
3. **Verify the native auth setup matches the backend**:
   - Confirm the app uses the Lovable OAuth broker for web and the system browser for native.
   - Confirm the iOS/Android bundle ID (`com.nerdcatwizard.cyrano`) and custom redirect scheme are registered correctly in the app config.
   - Ensure the public auth callback route (`/auth`) and deep-link listener are still wired correctly.
4. **Run a quick smoke test** to confirm Google and Apple sign-in buttons are present on `/auth` and route to the correct provider flow.

## Outcome
You will know exactly which Supabase project is being used and that Google/Apple sign-in is enabled in the backend, so the existing native OAuth flow can work once the app is deployed.
