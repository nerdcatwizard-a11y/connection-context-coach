// Client-side wrappers around the /api/ai/* routes.
// These replace the previous createServerFn RPCs so the app works from a
// Capacitor webview (capacitor://localhost), which does not share an origin
// or cookies with the deployed site.
import { supabase } from "@/integrations/supabase/client";

// Set VITE_API_BASE_URL to your deployed origin (e.g. https://cyrano.lovable.app)
// when building the Capacitor bundle. In the browser it stays relative.
const API_BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

async function post<T>(action: string, payload: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_BASE}/api/ai/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  });

  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
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
