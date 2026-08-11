Capacitor-readiness backend audit

Current state: Yes, the backend is architecturally ready for Capacitor wrapping. The heavy lifting is done.

What is already in place
- All AI features moved from `createServerFn` to file-based API routes at `/api/ai/$action` (`src/lib/ai.server.ts` + `src/routes/api/ai/$action.ts`).
- CORS configured for `capacitor://localhost`, `http://localhost`, Lovable preview, and the published domain (`src/lib/cors.ts`).
- Authentication uses `Authorization: Bearer <supabase access_token>` instead of cookies, so it works across origins from the Capacitor webview.
- SPA mode is enabled for Capacitor builds (`vite.config.ts`: `spa: { enabled: isCapacitorBuild }`).
- A `build:capacitor` script outputs a static shell to `dist/client` and copies `_shell.html` to `index.html`.
- `src/lib/ai-client.ts` fetches the API with a configurable `VITE_API_BASE_URL` so the Capacitor bundle can point at the deployed backend.
- Routes under `_authenticated` and auth routes have `ssr: false`, so no route depends on SSR.
- No remaining `createServerFn` / `useServerFn` usage in the feature code; only a stale comment remains in `ai-client.ts`.

Remaining gaps to make it truly optimal
1. Set `VITE_API_BASE_URL` for Capacitor builds. Without it, the Capacitor app will call `/api/ai/...` relative to `capacitor://localhost` and the AI routes will fail. It should point to the published Lovable URL (e.g. `https://connection-context-coach.lovable.app`).
2. Verify the static shell builds cleanly. `bun run build:capacitor` should be run and the `dist/client` folder inspected to confirm `index.html` and assets are present.
3. Decide on social auth behavior in the native app. Google OAuth redirects currently target `window.location.origin`, which is fine in the browser but needs Capacitor `Browser` plugin + deep-link handling if you want "Sign in with Google" inside the native wrapper. If you only use email/password, this is not a blocker.
4. (Optional) Remove the stale `createServerFn` comment in `src/lib/ai-client.ts` to avoid confusion.

Recommended next step
Add the `VITE_API_BASE_URL` build-time variable, run the Capacitor build, and do a quick smoke test that an authenticated request from the local shell hits `/api/ai/send-coach-message` successfully.
