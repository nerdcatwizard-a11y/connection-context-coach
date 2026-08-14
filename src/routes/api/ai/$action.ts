import { createFileRoute } from "@tanstack/react-router";
import { AI_ACTIONS, HttpError, requireAuth, type AiAction } from "@/lib/ai.server";
import { consumesQuota, consumeAiMessage, getUsage } from "@/lib/usage.server";
import { jsonWithCors, preflight } from "@/lib/cors";

async function handle(request: Request, action: string): Promise<Response> {
  try {
    const ctxForUsage = action === "get-usage" ? await requireAuth(request) : null;
    if (ctxForUsage) {
      return jsonWithCors(request, await getUsage(ctxForUsage), 200);
    }
    if (!(action in AI_ACTIONS)) {
      return jsonWithCors(request, { error: "Unknown action" }, 404);
    }
    const ctx = await requireAuth(request);
    if (consumesQuota(action)) await consumeAiMessage(ctx);
    const raw = request.method === "GET" ? {} : await request.json().catch(() => ({}));
    const result = await AI_ACTIONS[action as AiAction](raw, ctx);
    return jsonWithCors(request, result, 200);

  } catch (error) {
    if (error instanceof HttpError) {
      return jsonWithCors(request, { error: error.message }, error.status);
    }
    const message = error instanceof Error ? error.message : "Something went wrong.";
    console.error("[api/ai]", action, message);
    return jsonWithCors(request, { error: message }, 400);
  }
}

export const Route = createFileRoute("/api/ai/$action")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request, params }) => handle(request, params.action),
    },
  },
});
