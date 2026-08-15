/**
 * Apple / Google in-app purchase helpers (cordova-plugin-purchase v13).
 *
 * Premium is sold exclusively through the platform store inside the native
 * shell. On the web we never show a purchase button — Apple requires digital
 * subscriptions consumed in the app to go through In-App Purchase.
 */
import { isNative } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";

export const PREMIUM_MONTHLY_ID = "com.nerdcatwizard.cyrano.premium.monthly";
export const PREMIUM_YEARLY_ID = "com.nerdcatwizard.cyrano.premium.yearly";

export type PremiumProductId = typeof PREMIUM_MONTHLY_ID | typeof PREMIUM_YEARLY_ID;

const PUBLISHED_ORIGIN = "https://connection-context-coach.lovable.app";

function apiBase(): string {
  const configured = import.meta.env["VITE_API_BASE_URL"];
  if (typeof configured === "string" && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  return isNative() ? PUBLISHED_ORIGIN : "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyStore = any;

function globalStore(): AnyStore | undefined {
  const cdv = (globalThis as any).CdvPurchase;
  return cdv?.store;
}

let readyPromise: Promise<AnyStore | null> | null = null;

/** Loads and initializes the store plugin. Resolves null on web. */
export async function initStore(): Promise<AnyStore | null> {
  if (!isNative()) return null;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    // Capacitor injects the Cordova plugin JS into the webview at startup, so we
    // wait for the CdvPurchase global rather than importing the package.
    const CdvPurchase = await waitForPlugin();
    const store: AnyStore = CdvPurchase?.store;
    if (!store) return null;


    const platform =
      (globalThis as any).Capacitor?.getPlatform?.() === "android"
        ? CdvPurchase.Platform.GOOGLE_PLAY
        : CdvPurchase.Platform.APPLE_APPSTORE;

    store.register([
      { id: PREMIUM_MONTHLY_ID, type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform },
      { id: PREMIUM_YEARLY_ID, type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform },
    ]);

    store
      .when()
      .approved((tx: AnyStore) => {
        void verifyAndFinish(tx);
      })
      .verified((receipt: AnyStore) => receipt.finish?.());

    store.error((err: { message?: string }) => {
      console.error("[iap]", err?.message ?? err);
    });

    await store.initialize([platform]);
    return store;
  })();

  return readyPromise;
}

/** Sends the store receipt to our server, which unlocks Premium after validation. */
async function verifyAndFinish(tx: AnyStore) {
  try {
    const store = globalStore();
    const receipt =
      store?.localReceipts?.[0]?.nativeData?.appStoreReceipt ??
      tx?.parentReceipt?.nativeData?.appStoreReceipt ??
      null;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch(`${apiBase()}/api/iap/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        platform: (globalThis as any).Capacitor?.getPlatform?.() ?? "ios",
        productId: tx?.products?.[0]?.id ?? null,
        transactionId: tx?.transactionId ?? null,
        receipt,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e) {
    console.error("[iap] verify failed", e);
  } finally {
    tx?.finish?.();
  }
}

export type StorePrice = { id: PremiumProductId; price: string | null; title: string | null };

/** Store-localized pricing, so we never hardcode prices in the native app. */
export async function getPrices(): Promise<StorePrice[]> {
  const store = await initStore();
  if (!store) return [];
  return ([PREMIUM_MONTHLY_ID, PREMIUM_YEARLY_ID] as PremiumProductId[]).map((id) => {
    const product = store.get(id);
    const offer = product?.getOffer?.();
    return {
      id,
      price: offer?.pricingPhases?.[0]?.price ?? null,
      title: product?.title ?? null,
    };
  });
}

/** Starts the native purchase sheet. */
export async function purchasePremium(id: PremiumProductId): Promise<void> {
  const store = await initStore();
  if (!store) throw new Error("In-app purchases are only available in the Cyrano app.");
  const offer = store.get(id)?.getOffer?.();
  if (!offer) throw new Error("This subscription isn't available right now. Please try again.");
  await store.order(offer);
}

/** Restores previous purchases (required by App Review). */
export async function restorePurchases(): Promise<void> {
  const store = await initStore();
  if (!store) throw new Error("Restoring purchases is only available in the Cyrano app.");
  await store.restorePurchases();
}

export function storeAvailable(): boolean {
  return isNative();
}
