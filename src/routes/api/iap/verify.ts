import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, HttpError } from "@/lib/ai.server";
import { jsonWithCors, preflight } from "@/lib/cors";

const APPLE_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

const PREMIUM_IDS = new Set([
  "com.nerdcatwizard.cyrano.premium.monthly",
  "com.nerdcatwizard.cyrano.premium.yearly",
]);

type AppleResponse = {
  status: number;
  latest_receipt_info?: Array<{
    product_id?: string;
    expires_date_ms?: string;
    original_transaction_id?: string;
  }>;
};

async function verifyApple(receipt: string): Promise<AppleResponse> {
  const password = process.env["APPLE_SHARED_SECRET"];
  const body = JSON.stringify({
    "receipt-data": receipt,
    ...(password ? { password } : {}),
    "exclude-old-transactions": true,
  });
  const call = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return (await res.json()) as AppleResponse;
  };
  let data = await call(APPLE_PROD);
  if (data.status === 21007) data = await call(APPLE_SANDBOX);
  return data;
}

async function handle(request: Request): Promise<Response> {
  try {
    const ctx = await requireAuth(request);
    const body = (await request.json().catch(() => ({}))) as {
      platform?: string;
      productId?: string;
      transactionId?: string;
      receipt?: string;
    };

    if (!body.productId || !PREMIUM_IDS.has(body.productId)) {
      throw new HttpError(400, "Unknown product.");
    }
    if (!body.receipt) throw new HttpError(400, "Missing store receipt.");

    let renewsAt: string | null = null;
    let originalTransactionId = body.transactionId ?? null;

    if ((body.platform ?? "ios") === "ios") {
      const apple = await verifyApple(body.receipt);
      if (apple.status !== 0) throw new HttpError(400, "Apple could not validate this purchase.");
      const entries = apple.latest_receipt_info ?? [];
      const active = entries
        .filter((e) => e.product_id && PREMIUM_IDS.has(e.product_id))
        .sort((a, b) => Number(b.expires_date_ms ?? 0) - Number(a.expires_date_ms ?? 0))[0];
      if (!active) throw new HttpError(400, "No active Cyrano Premium subscription on this receipt.");
      const expiresMs = Number(active.expires_date_ms ?? 0);
      if (expiresMs && expiresMs < Date.now()) {
        throw new HttpError(400, "This subscription has expired.");
      }
      renewsAt = expiresMs ? new Date(expiresMs).toISOString() : null;
      originalTransactionId = active.original_transaction_id ?? originalTransactionId;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: ctx.userId,
        tier: "premium",
        renews_at: renewsAt,
        store: body.platform === "android" ? "google_play" : "app_store",
        store_transaction_id: originalTransactionId,
        store_product_id: body.productId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new HttpError(500, "Could not save your subscription. Please try again.");

    return jsonWithCors(request, { ok: true, tier: "premium", renewsAt }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonWithCors(request, { error: error.message }, error.status);
    }
    const message = error instanceof Error ? error.message : "Something went wrong.";
    console.error("[api/iap/verify]", message);
    return jsonWithCors(request, { error: message }, 400);
  }
}

export const Route = createFileRoute("/api/iap/verify")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
