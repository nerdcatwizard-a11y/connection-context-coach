import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, HttpError } from "@/lib/ai.server";
import { jsonWithCors, preflight } from "@/lib/cors";

/**
 * Permanently deletes the signed-in user's account.
 * All public tables reference auth.users(id) ON DELETE CASCADE, so removing the
 * auth user removes their rows. Stored screenshots live under {user_id}/ and are
 * cleared explicitly first.
 */
async function handle(request: Request): Promise<Response> {
  try {
    const ctx = await requireAuth(request);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove uploaded screenshots for this user.
    const { data: files } = await supabaseAdmin.storage.from("screenshots").list(ctx.userId, {
      limit: 1000,
    });
    if (files?.length) {
      await supabaseAdmin.storage
        .from("screenshots")
        .remove(files.map((f) => `${ctx.userId}/${f.name}`));
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(ctx.userId);
    if (error) throw new HttpError(500, "Could not delete your account. Please try again.");

    return jsonWithCors(request, { ok: true }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonWithCors(request, { error: error.message }, error.status);
    }
    const message = error instanceof Error ? error.message : "Something went wrong.";
    console.error("[api/account/delete]", message);
    return jsonWithCors(request, { error: message }, 400);
  }
}

export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
