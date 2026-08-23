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

/** Cordova plugins only clobber their globals after `deviceready` fires. */
function waitForDeviceReady(timeoutMs = 15000): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const anyDoc = document as any;
  if (anyDoc.__cordovaDeviceReady) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      anyDoc.__cordovaDeviceReady = true;
      resolve();
    };
    document.addEventListener("deviceready", done, { once: true });
    setTimeout(done, timeoutMs);
  });
}

/** Waits (up to ~15s) for Capacitor to inject the Cordova purchase plugin. */
async function waitForPlugin(): Promise<AnyStore | undefined> {
  await waitForDeviceReady();
  for (let i = 0; i < 60; i++) {
    const cdv = (globalThis as any).CdvPurchase;
    if (cdv?.store) return cdv;
    await new Promise((r) => setTimeout(r, 250));
  }
  return (globalThis as any).CdvPurchase;
}

/** Human-readable reason the store is unavailable, or null when it should work. */
export function storeUnavailableReason(): string | null {
  if (!isNative()) {
    return "Subscriptions are purchased inside the Cyrano app for iPhone or Android.";
  }
  if (!globalStore()) {
    return "The App Store connection isn't ready yet. Close and reopen Cyrano, then try again. If it keeps failing, this build is missing the purchase plugin — rebuild with `bun run build:capacitor` and run the app again from Xcode.";
  }
  return null;
}

/** Loads and initializes the store plugin. Resolves null on web. */
export async function initStore(): Promise<AnyStore | null> {
  if (!isNative()) return null;
  if (readyPromise) return readyPromise;

  const attempt = (async () => {
    // Capacitor injects the Cordova plugin JS into the webview at startup, so we
    // wait for the CdvPurchase global rather than importing the package.
    const CdvPurchase = await waitForPlugin();
    const store: AnyStore = CdvPurchase?.store;
    if (!store) {
      console.error("[iap] CdvPurchase global never appeared — native purchase plugin missing from this build");
      return null;
    }

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

  readyPromise = attempt;
  // Never cache a failed/empty init — the plugin may still arrive on a later tap.
  attempt
    .then((store) => {
      if (!store) readyPromise = null;
    })
    .catch(() => {
      readyPromise = null;
    });

  return attempt;
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
  if (!store) throw new Error(storeUnavailableReason() ?? "The App Store isn't available right now.");
  // Products load asynchronously after initialize(); give App Store Connect a moment.
  let offer = store.get(id)?.getOffer?.();
  for (let i = 0; !offer && i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250));
    offer = store.get(id)?.getOffer?.();
  }
  if (!offer) {
    throw new Error(
      `"${id}" isn't loading from the App Store. Check that the subscription is Ready to Submit, the bundle ID matches, and you're signed into a sandbox account.`,
    );
  }
  await store.order(offer);
}

/** Restores previous purchases (required by App Review). */
export async function restorePurchases(): Promise<void> {
  const store = await initStore();
  if (!store) throw new Error(storeUnavailableReason() ?? "The App Store isn't available right now.");
  await store.restorePurchases();
}

export function storeAvailable(): boolean {
  return isNative();
}

