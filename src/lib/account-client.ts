// Client-side wrapper around /api/account/*, using the same origin resolution
// as ai-client so it works inside the Capacitor webview.
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "@/lib/native";

const PUBLISHED_ORIGIN = "https://connection-context-coach.lovable.app";

function sanitizeBase(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed || trimmed.includes("${") || trimmed.includes("%")) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
}

function resolveApiBase(): string {
  const configured = sanitizeBase(import.meta.env["VITE_API_BASE_URL"]);
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol;
  if (isNative() || (protocol !== "http:" && protocol !== "https:")) return PUBLISHED_ORIGIN;
  const host = window.location.hostname;
  if (isNative() || host === "localhost" || host === "10.0.2.2") {
    if (!window.location.port) return PUBLISHED_ORIGIN;
  }
  return "";
}

/** Permanently deletes the signed-in user's account and all associated data. */
export async function deleteMyAccount(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let res: Response;
  try {
    res = await fetch(`${resolveApiBase()}/api/account/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: "{}",
    });
  } catch {
    throw new Error("Couldn't reach Cyrano's server. Check your connection and try again.");
  }

  const text = await res.text();
  let json: { error?: string } | null = null;
  try {
    json = text ? (JSON.parse(text) as { error?: string }) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
}
