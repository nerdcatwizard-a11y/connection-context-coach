# Enforce the 10-messages-per-day free limit

## Current state (verified)

- The home screen tells users: "Free plan: 10 AI messages per day."
- The database already has `usage_limits` (user_id, metric, period, period_start, count) and `subscriptions` (tier: free/…), both with RLS and grants.
- No code anywhere reads or writes `usage_limits`. Every AI action in `src/lib/ai.server.ts` runs after `requireAuth` with no quota check.

So: no, the limit is not enforced today. A free user can send unlimited messages.

## What to build

1. A server-side quota check inside the API gateway (`src/routes/api/ai/$action.ts` / `ai.server.ts`), applied to every billable action (coach message, help me reply, conversation starter, screenshot analysis, profile review, connection insight, follow-up). Read-only actions like `get-chat` stay free.
2. Counting: one row per user per UTC day with metric `ai_message`. Increment atomically via a `security definer` Postgres function so a user cannot spoof or reset their own count, and so concurrent requests can't over-spend.
3. Paid users bypass: if the user's `subscriptions.tier` is not `free`, skip the check.
4. When the count is already at 10, return HTTP 429 with a clear message ("You've used your 10 free messages today. Resets at midnight UTC." plus an upgrade pointer) instead of calling the AI.
5. Client: surface that message in the existing error areas of each feature, and add a small "X of 10 messages left today" indicator on the home screen fed by a lightweight usage endpoint.

## Technical details

- New migration: `public.consume_ai_message(_user_id uuid, _limit int)` — `security definer`, upserts today's row with `ON CONFLICT ... DO UPDATE SET count = usage_limits.count + 1 WHERE usage_limits.count < _limit`, returns remaining or a "denied" flag. Grant EXECUTE to `authenticated`/`service_role`.
- New `usage.server.ts` helper wrapping the RPC; called from the gateway handler before dispatching to `AI_ACTIONS`, throwing `HttpError(429, …)` when denied.
- New read-only action `get-usage` returning `{ used, limit, unlimited }` for the home indicator.
- Daily limit kept as a single constant so it's easy to change.

## Open question

Confirm the reset window: midnight UTC (simplest) vs. the user's local midnight vs. a rolling 24 hours.
