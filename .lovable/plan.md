# Premium enforcement, new free limits, and clean app launch

## What changes for a free user

- Advice chat: 5 messages per day.
- Pickup Lines: 2 generations per day.
- Everything else that calls Cyrano's AI is Premium-only: Text Analyzer, Review A Dating Profile, the home "How do I respond to this text?" flow / Help Me Reply, connection insights, and follow-up questions.
- People (connections) and Journal stay fully free.
- Both counters reset at midnight UTC. Counts live in the database against the account, so closing the app, reinstalling, or signing out and back in does not reset anything.

## What changes for a Premium user

- No limits and no locks anywhere.
- Every "upgrade", "X of Y left today", and "free plan" message disappears once the account is Premium.
- The subscribe buttons are replaced by a "You're Premium" panel (with renewal date and Restore purchases), so a Premium user cannot start a second purchase.
- The purchase endpoint also refuses to attach a store receipt that is already tied to a different account, and refuses to create a second subscription row for an account that already has an active one.

## Other requested fixes

- Auth screen headline changes from "Welcome back" to "Welcome".
- Cold start: the native splash stays up while the app checks for an existing session, then goes straight to Home if signed in, or straight to the sign-in screen if not. The sign-in screen no longer flashes for logged-in users.

## Technical details

Database (one migration):
- Replace `consume_ai_message(_limit)` with `consume_usage(_metric text, _limit int)` — same atomic upsert, keyed on `usage_limits (user_id, metric, period, period_start)`, with metrics `ai_message` and `pickup_line`.
- Replace `get_ai_usage()` with `get_usage_counts()` returning both metrics' counts for today.
- Add a unique index on `subscriptions.store_transaction_id` so one store subscription cannot be claimed by two accounts.

Server (`src/lib/usage.server.ts`, `src/routes/api/ai/$action.ts`):
- Action policy map: `send-coach-message` → metric `ai_message` limit 5; `conversation-starter` → metric `pickup_line` limit 2; `get-chat` / `get-usage` free; all other actions → Premium-only, returning HTTP 402 with an upgrade message for free accounts.
- Premium check reads `subscriptions.tier` server-side on every request; the client is never trusted.
- `get-usage` returns `{ tier, unlimited, chat: {used, limit}, pickup: {used, limit} }`.

Client:
- New `usePremium()` hook wrapping the `get-usage` response (cached, refreshed after purchase) used by Home, Pickup Lines, Advice, Pricing, Account, and the menu.
- Premium-only screens render a locked state with a single "Unlock with Premium" call to action instead of the form.
- Home hero shows "5 of 5 messages left today" / "2 pickup lines left today" for free accounts and nothing for Premium.
- `src/lib/iap.ts` `purchasePremium` refuses to start when the account is already Premium; Pricing and Account render the Premium panel instead of buy buttons.
- `src/routes/api/iap/verify.ts` rejects receipts whose `store_transaction_id` belongs to another user and no-ops (returns success) when the same account already holds that subscription.

Launch flow:
- Add `@capacitor/splash-screen` with autohide disabled; a small boot gate resolves `supabase.auth.getUser()` before the first route render, then navigates to `/home` or `/auth` and hides the splash. On web the same gate shows the brand screen briefly instead of the auth flash.

## Note

Apple/Google purchases are only testable in the native build, so after this ships you'll need `bun run build:capacitor` and a sandbox account to confirm the Premium unlock end to end.
