// Server-only daily usage quota for AI actions.
// Counts reset at midnight UTC (usage_limits.period_start = current UTC date).
import { HttpError, type AuthedContext } from "./ai.server";

export const DAILY_AI_MESSAGE_LIMIT = 10;

/** Actions that do NOT consume quota (reads only). */
const FREE_ACTIONS = new Set(["get-chat", "get-usage"]);

export function consumesQuota(action: string): boolean {
  return !FREE_ACTIONS.has(action);
}

async function isUnlimited(ctx: AuthedContext): Promise<boolean> {
  const { data } = await ctx.supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return Boolean(data?.tier && data.tier !== "free");
}

export async function getUsage(ctx: AuthedContext): Promise<{
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}> {
  const unlimited = await isUnlimited(ctx);
  const { data } = await ctx.supabase.rpc("get_ai_usage");
  const row = Array.isArray(data) ? data[0] : data;
  const used = Number((row as { used?: number } | number | null) === null
    ? 0
    : typeof row === "number"
      ? row
      : (row?.used ?? 0));
  return {
    used,
    limit: DAILY_AI_MESSAGE_LIMIT,
    remaining: Math.max(DAILY_AI_MESSAGE_LIMIT - used, 0),
    unlimited,
  };
}

/**
 * Atomically consumes one AI message from today's allowance.
 * Throws HttpError(429) when the free daily limit is already spent.
 */
export async function consumeAiMessage(ctx: AuthedContext): Promise<void> {
  if (await isUnlimited(ctx)) return;

  const { data, error } = await ctx.supabase.rpc("consume_ai_message", {
    _limit: DAILY_AI_MESSAGE_LIMIT,
  });
  if (error) throw new HttpError(500, "Could not check your daily usage. Please try again.");

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = (row as { allowed?: boolean } | null)?.allowed;
  if (allowed === false) {
    throw new HttpError(
      429,
      `You've used your ${DAILY_AI_MESSAGE_LIMIT} free messages today. Resets at midnight UTC — or upgrade for unlimited coaching.`,
    );
  }
}
