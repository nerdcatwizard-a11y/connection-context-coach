// Client-side wrappers around the /api/ai/* routes.
// These are used from the browser and from the Capacitor webview
// (capacitor://localhost), which does not share an origin or cookies with the
// deployed site. VITE_API_BASE_URL sets the deployed origin for Capacitor builds.
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "@/lib/native";

// Deployed origin used by the native (Capacitor) shell, where the app files are
// served from capacitor://localhost and relative /api/* URLs would hit the local
// static shell instead of the server.
const PUBLISHED_ORIGIN = "https://connection-context-coach.lovable.app";

function resolveApiBase(): string {
  const configured = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol;
  if (isNative() || (protocol !== "http:" && protocol !== "https:")) return PUBLISHED_ORIGIN;
  return "";
}

async function post<T>(action: string, payload: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const url = `${resolveApiBase()}/api/ai/${action}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload ?? {}),
    });
  } catch {
    throw new Error("Couldn't reach Cyrano's server. Check your connection and try again.");
  }

  const text = await res.text();
  let json: (Record<string, unknown> & { error?: string }) | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown> & { error?: string }) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  if (!json) {
    throw new Error(
      `Unexpected response from the server (HTTP ${res.status}) — the app may be pointed at the wrong API URL (${url}). ${text.slice(0, 120)}`,
    );
  }
  return json as T;
}


type Args<T> = { data: T };

export const sendCoachMessage = (a: Args<{
  chatId?: string | null;
  connectionId?: string | null;
  message: string;
  analysis?: boolean;
}>) => post<{ chatId: string; reply: string }>("send-coach-message", a.data);

export const getChat = (a: Args<{ chatId: string }>) =>
  post<{
    chat: { id: string; title: string | null; connection_id: string | null; created_at: string };
    messages: Array<{ id: string; role: string; content: string; created_at: string }>;
  }>("get-chat", a.data);

export const helpMeReply = (a: Args<{
  received?: string;
  goal?: string;
  tone?: string;
  history?: string;
  analysis?: boolean;
  images?: string[];
}>) => post<{ reply: string }>("help-me-reply", a.data);

export const conversationStarter = (a: Args<{
  profileNotes?: string;
  datingApp?: string;
  goal?: string;
  tone?: string;
  images?: string[];
  analysis?: boolean;
}>) => post<{ reply: string }>("conversation-starter", a.data);

export const analyzeScreenshots = (a: Args<{
  images?: string[];
  requestType?: "understand" | "reply" | "review";
  userContext?: string;
  analysis?: boolean;
}>) => post<{ analysis: string }>("analyze-screenshots", a.data);

export const reviewProfile = (a: Args<{
  whose?: "me" | "connection";
  datingApp?: string;
  bio?: string;
  prompts?: string;
  goal?: string;
  audience?: string;
  whatIsntWorking?: string;
  photoUrls?: string[];
  analysis?: boolean;
}>) => post<{ feedback: string }>("review-profile", a.data);

export const generateConnectionInsight = (a: Args<{ connectionId: string; analysis?: boolean }>) =>
  post<{ insight: string }>("connection-insight", a.data);

export const askFollowUp = (a: Args<{
  feature: string;
  priorLabel?: string;
  priorOutput: string;
  situationContext?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
  analysis?: boolean;
}>) => post<{ reply: string }>("ask-follow-up", a.data);

export const getUsage = () =>
  post<{ used: number; limit: number; remaining: number; unlimited: boolean }>("get-usage", {});
