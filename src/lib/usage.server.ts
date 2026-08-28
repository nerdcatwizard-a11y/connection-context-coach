// Server-only entitlement + daily usage quota for AI actions.
// Counts live in the database (usage_limits) keyed by user + UTC day, so
// signing out, reinstalling, or restarting the app never resets them.
import { HttpError, type AuthedContext } from "./ai.server";

export const CHAT_DAILY_LIMIT = 5;
export const PICKUP_DAILY_LIMIT = 2;

type Metric = "ai_message" | "pickup_line";

type Policy =
  | { kind: "free" }
  | { kind: "metered"; metric: Metric; limit: number; label: string }
  | { kind: "premium"; label: string };

const POLICIES: Record<string, Policy> = {
  "get-chat": { kind: "free" },
  "get-usage": { kind: "free" },
  "send-coach-message": { kind: "metered", metric: "ai_message", limit: CHAT_DAILY_LIMIT, label: "chat messages" },
  "conversation-starter": { kind: "metered", metric: "pickup_line", limit: PICKUP_DAILY_LIMIT, label: "pickup line generations" },
  "help-me-reply": { kind: "premium", label: "Text Response" },
  "analyze-screenshots": { kind: "premium", label: "Text Analyzer" },
  "review-profile": { kind: "premium", label: "Dating profile reviews" },
  "connection-insight": { kind: "premium", label: "Connection insights" },
  "ask-follow-up": { kind: "premium", label: "Follow-up questions" },
};

function policyFor(action: string): Policy {
  return POLICIES[action] ?? { kind: "premium", label: "This feature" };
}

export async function isPremium(ctx: AuthedContext): Promise<boolean> {
  const { data } = await ctx.supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return data?.tier === "premium";
}

export type UsageSummary = {
  tier: "free" | "premium";
  unlimited: boolean;
  chat: { used: number; limit: number; remaining: number };
  pickup: { used: number; limit: number; remaining: number };
};

export async function getUsage(ctx: AuthedContext): Promise<UsageSummary> {
  const premium = await isPremium(ctx);
  const { data } = await ctx.supabase.rpc("get_usage_counts");
  const row = (Array.isArray(data) ? data[0] : data) as
    | { chat_used?: number; pickup_used?: number }
    | null;
  const chatUsed = Number(row?.chat_used ?? 0);
  const pickupUsed = Number(row?.pickup_used ?? 0);
  return {
    tier: premium ? "premium" : "free",
    unlimited: premium,
    chat: {
      used: chatUsed,
      limit: CHAT_DAILY_LIMIT,
      remaining: Math.max(CHAT_DAILY_LIMIT - chatUsed, 0),
    },
    pickup: {
      used: pickupUsed,
      limit: PICKUP_DAILY_LIMIT,
      remaining: Math.max(PICKUP_DAILY_LIMIT - pickupUsed, 0),
    },
  };
}

/**
 * Enforces entitlements for an action. Premium accounts always pass.
 * Free accounts consume one unit of the action's daily metric, or are
 * refused outright when the action is Premium-only.
 */
export async function enforceEntitlement(ctx: AuthedContext, action: string): Promise<void> {
  const policy = policyFor(action);
  if (policy.kind === "free") return;
  if (await isPremium(ctx)) return;

  if (policy.kind === "premium") {
    throw new HttpError(
      402,
      `${policy.label} is part of Cyrano Premium. Upgrade to unlock it.`,
    );
  }

  const { data, error } = await ctx.supabase.rpc("consume_usage", {
    _metric: policy.metric,
    _limit: policy.limit,
  });
  if (error) throw new HttpError(500, "Could not check your daily usage. Please try again.");

  const row = (Array.isArray(data) ? data[0] : data) as { allowed?: boolean } | null;
  if (row?.allowed === false) {
    throw new HttpError(
      429,
      `You've used your ${policy.limit} free ${policy.label} for today. Resets at midnight UTC — or upgrade to Premium for unlimited.`,
    );
  }
}
