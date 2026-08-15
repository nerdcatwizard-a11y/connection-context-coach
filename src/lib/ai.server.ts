// Server-only AI logic. Never imported by client code.
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { CYRANO_SYSTEM_PROMPT, cyranoModeMessage } from "./cyrano-prompt.server";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AuthedContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
};

/**
 * Verifies the caller from the Authorization: Bearer <supabase access token> header.
 * Cookies are never used, so this works identically from a browser and from a
 * Capacitor webview on capacitor://localhost.
 */
export async function requireAuth(request: Request): Promise<AuthedContext> {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new HttpError(500, "Supabase is not configured on the server.");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) {
    throw new HttpError(401, "Unauthorized");
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new HttpError(401, "Unauthorized");

  return { supabase, userId: data.claims.sub as string };
}

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("image_url"),
          image_url: z.object({ url: z.string() }),
        }),
      ]),
    ),
  ]),
});
type Message = z.infer<typeof MessageSchema>;

async function callGateway(messages: Message[], opts: { model?: string } = {}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new HttpError(500, "Lovable AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: opts.model ?? "google/gemini-2.5-flash", messages }),
  });
  if (res.status === 429) throw new HttpError(429, "Rate limit reached. Please try again in a moment.");
  if (res.status === 402)
    throw new HttpError(402, "AI credits exhausted. Please add credits in your workspace.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(502, `AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new HttpError(502, "No response from AI.");
  return content;
}

// =========================
// Schemas
// =========================
const ChatInput = z.object({
  chatId: z.string().uuid().nullable().optional(),
  connectionId: z.string().uuid().nullable().optional(),
  message: z.string().max(8000).optional().default(""),
  images: z.array(z.string().url().or(z.string().startsWith("data:"))).max(10).optional(),
  analysis: z.boolean().optional().default(false),
}).refine((v) => !!v.message?.trim() || (v.images?.length ?? 0) > 0, {
  message: "Write a message or attach a screenshot.",
});

const HelpMeReplyInput = z
  .object({
    received: z.string().max(4000).optional(),
    goal: z.string().max(1000).optional(),
    tone: z.string().max(60).optional(),
    history: z.string().max(4000).optional(),
    analysis: z.boolean().optional().default(false),
    images: z.array(z.string().url().or(z.string().startsWith("data:"))).max(10).optional(),
  })
  .refine((v) => !!v.received?.trim() || (v.images?.length ?? 0) > 0, {
    message: "Paste their message or upload a screenshot.",
  });

const ConversationStarterInput = z.object({
  profileNotes: z.string().max(4000).optional(),
  datingApp: z.string().max(60).optional(),
  goal: z.string().max(500).optional(),
  tone: z.string().max(60).optional(),
  images: z.array(z.string().url().or(z.string().startsWith("data:"))).max(9).optional(),
  analysis: z.boolean().optional().default(false),
});

const AnalyzeScreenshotsInput = z
  .object({
    images: z.array(z.string().url().or(z.string().startsWith("data:"))).max(6).optional().default([]),
    requestType: z.enum(["understand", "reply", "review"]).default("understand"),
    userContext: z.string().max(2000).optional(),
    analysis: z.boolean().optional().default(false),
  })
  .refine((v) => (v.images?.length ?? 0) > 0 || !!v.userContext?.trim(), {
    message: "Add a screenshot or write some context.",
  });

const ReviewProfileInput = z.object({
  whose: z.enum(["me", "connection"]).default("me"),
  datingApp: z.string().max(60).optional(),
  bio: z.string().max(4000).optional(),
  prompts: z.string().max(4000).optional(),
  goal: z.string().max(500).optional(),
  audience: z.string().max(500).optional(),
  whatIsntWorking: z.string().max(1000).optional(),
  photoUrls: z.array(z.string()).max(9).optional(),
  analysis: z.boolean().optional().default(false),
});

const ConnectionInsightInput = z.object({
  connectionId: z.string().uuid(),
  analysis: z.boolean().optional().default(false),
});

const FollowUpTurn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const AskFollowUpInput = z.object({
  feature: z.string().max(60),
  priorLabel: z.string().max(120).optional(),
  priorOutput: z.string().min(1).max(12000),
  situationContext: z.string().max(4000).optional(),
  history: z.array(FollowUpTurn).max(20).default([]),
  question: z.string().min(1).max(4000),
  analysis: z.boolean().optional().default(false),
});

const GetChatInput = z.object({ chatId: z.string().uuid() });

// =========================
// Handlers
// =========================
async function sendCoachMessage(raw: unknown, ctx: AuthedContext) {
  const data = ChatInput.parse(raw);
  const { supabase, userId } = ctx;

  const coachImages = data.images ?? [];
  const messageText = data.message?.trim() || "Read the attached screenshot(s) and tell me how to respond.";

  let chatId = data.chatId ?? null;
  if (!chatId) {
    const title = messageText.slice(0, 60);
    const { data: created, error } = await supabase
      .from("chats")
      .insert({ user_id: userId, title, connection_id: data.connectionId ?? null })
      .select("id")
      .single();
    if (error) throw new HttpError(400, error.message);
    chatId = created.id;
  }

  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(30);

  const messages: Message[] = [
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    ...(history ?? []).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    {
      role: "user",
      content:
        coachImages.length > 0
          ? [
              { type: "text" as const, text: messageText },
              ...coachImages.map((url) => ({ type: "image_url" as const, image_url: { url } })),
            ]
          : messageText,
    },
  ];

  await supabase.from("chat_messages").insert({
    chat_id: chatId,
    user_id: userId,
    role: "user",
    content: messageText,
  });

  const reply = await callGateway(messages);

  await supabase.from("chat_messages").insert({
    chat_id: chatId,
    user_id: userId,
    role: "assistant",
    content: reply,
  });

  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);

  return { chatId, reply };
}

async function getChat(raw: unknown, ctx: AuthedContext) {
  const data = GetChatInput.parse(raw);
  const { supabase } = ctx;
  const { data: chat, error } = await supabase
    .from("chats")
    .select("id, title, connection_id, created_at")
    .eq("id", data.chatId)
    .maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!chat) throw new HttpError(404, "Chat not found");
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", data.chatId)
    .order("created_at", { ascending: true });
  return { chat, messages: messages ?? [] };
}

async function helpMeReply(raw: unknown) {
  const data = HelpMeReplyInput.parse(raw);
  const images = data.images ?? [];
  const prompt = `${
    data.received?.trim()
      ? `The user received this message:\n"""\n${data.received}\n"""`
      : "The user attached screenshot(s) of the conversation instead of pasting text."
  }
${data.history ? `Prior conversation for context:\n"""\n${data.history}\n"""\n` : ""}
${data.goal ? `What they want to happen next: ${data.goal}` : ""}
${data.tone ? `Preferred tone: ${data.tone}` : ""}
${images.length > 0 ? "\nRead the attached screenshot(s) to understand the latest message and the conversation so far." : ""}

Return exactly three distinct reply options that sound like a real person — natural, warm, respectful, and honest. Avoid clichés, cheesy lines, or over-clever wordplay. For each option, briefly note the vibe in one line (e.g. "Playful and light", "Direct and warm", "Curious and grounded") and then the message on the next line. Format:

1. [Vibe]
Message text

2. [Vibe]
Message text

3. [Vibe]
Message text

${data.analysis ? `After the three options, add one short line labeled "Read on what's going on:" giving a fair, honest observation about the message and one thing to consider.` : "Return only the three options. Do not add any analysis, commentary, or explanation after them."}`;

  const reply = await callGateway([
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    {
      role: "user",
      content:
        images.length > 0
          ? [
              { type: "text" as const, text: prompt },
              ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
            ]
          : prompt,
    },
  ]);
  return { reply };
}

async function conversationStarter(raw: unknown) {
  const data = ConversationStarterInput.parse(raw);
  const hasNotes = !!data.profileNotes?.trim();
  const hasImages = !!data.images?.length;
  if (!hasNotes && !hasImages) {
    throw new HttpError(400, "Add profile notes or a screenshot to work from.");
  }

  const textPart = `The user wants to open a conversation on a dating platform${data.datingApp ? ` (${data.datingApp})` : ""}.

${hasNotes ? `What they noticed / know about the person's profile:\n"""\n${data.profileNotes}\n"""` : "They've attached screenshots of the profile — read them carefully."}
${data.goal ? `What they want out of the connection: ${data.goal}` : ""}
${data.tone ? `Preferred tone: ${data.tone}` : ""}

Return three distinct opener options grounded in something specific from the profile. Avoid clichés ("hey, how's your week?"), cheesy pickup lines, canned compliments about looks, and anything that sounds AI-generated. Each opener should invite a real reply. Format:

1. [Vibe]
Opener text

2. [Vibe]
Opener text

3. [Vibe]
Opener text

${data.analysis ? `After the three, add one short "Why these work:" line explaining what specifically they anchor on.` : "Return only the three openers. Do not add any analysis, commentary, or explanation after them."}`;

  const messages: Message[] = [
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    {
      role: "user",
      content: hasImages
        ? [
            { type: "text", text: textPart },
            ...(data.images ?? []).map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ]
        : textPart,
    },
  ];

  const reply = await callGateway(messages);
  return { reply };
}

async function analyzeScreenshots(raw: unknown, ctx: AuthedContext) {
  const data = AnalyzeScreenshotsInput.parse(raw);
  const { supabase, userId } = ctx;

  const instruction =
    data.requestType === "reply"
      ? "The user wants three natural, respectful reply options they could send next. Also note tone shifts and anything ambiguous."
      : data.requestType === "review"
        ? "The user wants an honest review of how this conversation is going: what's working, what isn't, and one grounded next step."
        : "The user wants to understand what's going on in this conversation — tone, likely interpretations (multiple if ambiguous), and one grounded next step. Do not diagnose or label the other person.";

  const textBlock = `${instruction}${data.userContext ? `\n\nUser's own context: ${data.userContext}` : ""}${data.images.length > 0 ? "\n\nRead the screenshots below carefully. Separate observable facts from interpretations." : "\n\nNo screenshots were attached — work only from what the user wrote above."}`;

  const messages: Message[] = [
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    {
      role: "user",
      content:
        data.images.length > 0
          ? [
              { type: "text", text: textBlock },
              ...data.images.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
            ]
          : textBlock,
    },
  ];

  const analysis = await callGateway(messages);

  await supabase.from("screenshot_analyses").insert({
    user_id: userId,
    request_type: data.requestType,
    user_context: data.userContext ?? null,
    analysis,
  });

  return { analysis };
}

async function reviewProfile(raw: unknown, ctx: AuthedContext) {
  const data = ReviewProfileInput.parse(raw);
  const { supabase, userId } = ctx;

  const textPart = `Review a dating profile ${
    data.whose === "me" ? "for the user themselves" : "for someone they're connected with"
  }${data.datingApp ? ` on ${data.datingApp}` : ""}.

${data.bio ? `Bio:\n"""\n${data.bio}\n"""\n` : ""}
${data.prompts ? `Prompts / answers:\n"""\n${data.prompts}\n"""\n` : ""}
${data.goal ? `Relationship goal: ${data.goal}` : ""}
${data.audience ? `Who they'd like to attract: ${data.audience}` : ""}
${data.whatIsntWorking ? `What isn't working: ${data.whatIsntWorking}` : ""}

Give practical, honest feedback: what's working, what's flat or generic, and specific rewrites. If photos are attached, note what they communicate as a set (variety, energy, clarity) without evaluating attractiveness. Suggest one rewritten bio and up to three rewritten prompt answers. Keep it warm, not harsh.`;

  const messages: Message[] = [
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    {
      role: "user",
      content: data.photoUrls?.length
        ? [
            { type: "text", text: textPart },
            ...data.photoUrls.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ]
        : textPart,
    },
  ];

  const feedback = await callGateway(messages);

  await supabase.from("profile_reviews").insert({
    user_id: userId,
    dating_app: data.datingApp ?? null,
    bio: data.bio ?? null,
    relationship_goal: data.goal ?? null,
    desired_audience: data.audience ?? null,
    what_isnt_working: data.whatIsntWorking ?? null,
    feedback,
  });

  return { feedback };
}

async function generateConnectionInsight(raw: unknown, ctx: AuthedContext) {
  const data = ConnectionInsightInput.parse(raw);
  const { supabase, userId } = ctx;

  const { data: conn, error: cErr } = await supabase
    .from("connections")
    .select("*")
    .eq("id", data.connectionId)
    .maybeSingle();
  if (cErr) throw new HttpError(400, cErr.message);
  if (!conn) throw new HttpError(404, "Connection not found");

  const { data: events } = await supabase
    .from("connection_timeline_events")
    .select("event_type, title, body, occurred_at")
    .eq("connection_id", data.connectionId)
    .order("occurred_at", { ascending: true })
    .limit(80);

  const summary = `Connection: ${conn.nickname || conn.first_name || "Unnamed"}
Stage: ${conn.stage}
Where met / app: ${conn.dating_app ?? "—"} / ${conn.where_met ?? "—"}
User's goal: ${conn.user_goal ?? "—"}
Important context: ${conn.important_context ?? "—"}
Known boundaries: ${conn.known_boundaries ?? "—"}
Concerns: ${conn.concerns ?? "—"}
Positive developments: ${conn.positive_developments ?? "—"}

Timeline:
${
  (events ?? [])
    .map(
      (e) =>
        `- [${new Date(e.occurred_at).toISOString().slice(0, 10)}] (${e.event_type}) ${e.title}${
          e.body ? ` — ${e.body}` : ""
        }`,
    )
    .join("\n") || "(no events yet)"
}

Give a short, honest pattern read: 2–4 observations (each 1–2 sentences), each grounded in specific timeline items. End with one grounded next step. Do NOT diagnose or label the other person. Separate facts from interpretations. If there's not enough context yet, say so briefly.`;

  const reply = await callGateway([
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    { role: "user", content: summary },
  ]);

  await supabase.from("connection_insights").insert({
    user_id: userId,
    connection_id: data.connectionId,
    observation: reply,
  });

  return { insight: reply };
}

async function askFollowUp(raw: unknown) {
  const data = AskFollowUpInput.parse(raw);
  const framing = `The user is asking a follow-up about your earlier response in the "${data.feature}" feature.

${data.situationContext ? `Situation context they already provided:\n"""\n${data.situationContext}\n"""\n` : ""}
Your prior ${data.priorLabel ?? "response"}:
"""
${data.priorOutput}
"""

Answer their follow-up directly and briefly. Reference the prior response when useful. Keep it tight and easy to digest — no re-summarizing everything above.`;

  const messages: Message[] = [
    { role: "system", content: CYRANO_SYSTEM_PROMPT },
    cyranoModeMessage(data.analysis),
    { role: "user", content: framing },
    ...data.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: data.question },
  ];

  const reply = await callGateway(messages);
  return { reply };
}

export const AI_ACTIONS = {
  "send-coach-message": sendCoachMessage,
  "get-chat": getChat,
  "help-me-reply": (raw: unknown, _ctx: AuthedContext) => helpMeReply(raw),
  "conversation-starter": (raw: unknown, _ctx: AuthedContext) => conversationStarter(raw),
  "analyze-screenshots": analyzeScreenshots,
  "review-profile": reviewProfile,
  "connection-insight": generateConnectionInsight,
  "ask-follow-up": (raw: unknown, _ctx: AuthedContext) => askFollowUp(raw),
} satisfies Record<string, (raw: unknown, ctx: AuthedContext) => Promise<unknown>>;

export type AiAction = keyof typeof AI_ACTIONS;
