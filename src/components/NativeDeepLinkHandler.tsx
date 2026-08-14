import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { isNative } from "@/lib/native";
import { closeNativeBrowser, completeNativeAuthFromUrl } from "@/lib/native-auth";

/**
 * Registers the global Capacitor `appUrlOpen` listener once, on the client only.
 * On web (and during SSR) this renders nothing and registers nothing.
 */
export function NativeDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative()) return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url || !url.includes("auth-callback")) return;
        try {
          const signedIn = await completeNativeAuthFromUrl(url);
          await closeNativeBrowser();
          if (signedIn) navigate({ to: "/home", replace: true });
        } catch (err) {
          await closeNativeBrowser();
          toast.error(err instanceof Error ? err.message : "Sign in failed. Please try again.");
        }
      });

      if (cancelled) {
        await handle.remove();
        return;
      }
      removeListener = () => {
        void handle.remove();
      };
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
