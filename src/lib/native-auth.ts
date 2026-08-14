import { supabase } from "@/integrations/supabase/client";
import { NATIVE_AUTH_CALLBACK, isNative, parseAuthCallbackUrl } from "@/lib/native";

/**
 * Starts an OAuth sign-in from the native shell.
 *
 * Google rejects OAuth inside embedded webviews (`disallowed_useragent`), so we
 * ask Supabase for the authorization URL without redirecting, then hand it to
 * the Capacitor Browser plugin, which opens SFSafariViewController (iOS) or
 * Chrome Custom Tabs (Android). The provider returns to NATIVE_AUTH_CALLBACK,
 * which the appUrlOpen listener in __root.tsx picks up.
 */
export async function signInWithOAuthNative(provider: "google" | "apple") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_AUTH_CALLBACK,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Could not start sign in. Please try again.");

  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: data.url, presentationStyle: "popover" });
}

/**
 * Completes the round trip: turns the deep-link URL into a Supabase session.
 * Returns true when a session was established.
 */
export async function completeNativeAuthFromUrl(rawUrl: string): Promise<boolean> {
  const { accessToken, refreshToken, code, error } = parseAuthCallbackUrl(rawUrl);

  if (error) throw new Error(error);

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    return true;
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }

  return false;
}

/** Closes the system browser sheet after the redirect comes back. */
export async function closeNativeBrowser() {
  if (!isNative()) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // Already dismissed by the OS — nothing to do.
  }
}
