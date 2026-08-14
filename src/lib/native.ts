/**
 * Native (Capacitor) detection + the deep-link callback used for OAuth.
 *
 * The webview origin `capacitor://localhost` is NOT a registered OS URL scheme,
 * so providers cannot reliably redirect back to it. We use a custom scheme that
 * matches the Capacitor appId and is registered in Info.plist / AndroidManifest.
 */
export const NATIVE_AUTH_CALLBACK = "com.nerdcatwizard.cyrano://auth-callback";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True only inside the iOS/Android Capacitor shell. False on web and during SSR. */
export function isNative(): boolean {
  const c = cap();
  if (!c) return false;
  if (typeof c.isNativePlatform === "function") return c.isNativePlatform();
  const platform = c.getPlatform?.();
  return platform === "ios" || platform === "android";
}

/** Extracts auth params from a deep link, whether they arrive in the hash or the query. */
export function parseAuthCallbackUrl(rawUrl: string): {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  error?: string;
} {
  let search = "";
  let hash = "";
  try {
    const url = new URL(rawUrl);
    search = url.search.startsWith("?") ? url.search.slice(1) : url.search;
    hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  } catch {
    const hashIndex = rawUrl.indexOf("#");
    const queryIndex = rawUrl.indexOf("?");
    if (hashIndex >= 0) hash = rawUrl.slice(hashIndex + 1);
    if (queryIndex >= 0) {
      search = rawUrl.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined);
    }
  }

  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash);
  const pick = (key: string) => hashParams.get(key) ?? params.get(key) ?? undefined;

  return {
    accessToken: pick("access_token"),
    refreshToken: pick("refresh_token"),
    code: pick("code"),
    error: pick("error_description") ?? pick("error"),
  };
}
