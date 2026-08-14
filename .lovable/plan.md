# Fix "Cannot read properties of null (reading 'chatId')" in the native app

## What's happening

In the native (Xcode) build the app's files are served from `capacitor://localhost`. The AI calls in `src/lib/ai-client.ts` use a base URL that only gets set at build time, from the `VITE_API_BASE_URL` variable baked in by the `build:capacitor` script. If the bundle was produced any other way (plain `vite build`, or a build where that variable wasn't passed), the base is empty and the app requests `capacitor://localhost/api/ai/send-coach-message` — which is the local static shell, not your server.

That request comes back as the HTML shell (or an empty/opaque response), so `res.json()` fails, the code turns it into `null`, and then reads `.chatId` off `null`. Hence the error you see. It's a wiring/config symptom, not a chat bug — the same failure would hit every AI feature, not just the coach.

## The fix

### 1. Resolve the API base at runtime, not only at build time

In `src/lib/ai-client.ts`, compute the base as:

1. `VITE_API_BASE_URL` if it was baked in, else
2. when running inside Capacitor (`isNative()` from `src/lib/native.ts`) or the page origin isn't http/https, fall back to the published origin `https://connection-context-coach.lovable.app`, else
3. empty (relative) for normal web.

This makes the native app work regardless of how the bundle was built, and leaves web behaviour untouched.

### 2. Fail loudly instead of returning null

In the `post()` helper, read the response as text and parse it defensively:

- non-JSON body → throw a clear error like "Unexpected response from the server (HTTP 200) — the app may be pointed at the wrong API URL", including the first part of the body for diagnosis
- JSON body but `!res.ok` → keep throwing the server's `error` message
- network failure → throw a "Couldn't reach Cyrano's server" message

No caller can then read a property off `null`.

### 3. Confirm the server accepts the native origin

`src/lib/cors.ts` already allows `capacitor://localhost`, `ionic://localhost` and `http://localhost`, and `/api/ai/$action` handles preflight. Verify the deployed site responds to an `OPTIONS` and a `POST` from those origins after the change; adjust the allow-list only if something is missing.

### 4. Rebuild for native

Use `bun run build:capacitor` (not plain `bun run build`), then `npx cap sync`, then run in Xcode. After the change in step 1 the app works even without the env var, but this script remains the correct build path.

## Verification

- Web preview: coach chat still works, requests stay relative.
- Native: from Xcode, sign in and send a coach message — expect a reply, and in Safari's Web Inspector a request to `https://connection-context-coach.lovable.app/api/ai/send-coach-message` returning JSON.
- If it still fails, the new error message will name the cause (auth 401, CORS, or wrong URL) instead of the null read.

## Files touched

- `src/lib/ai-client.ts` (base URL resolution + safe response parsing)
- possibly `src/lib/cors.ts` if a native origin turns out to be rejected
