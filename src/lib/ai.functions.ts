import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CYRANO_SYSTEM_PROMPT } from "./cyrano-prompt.server";

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

const ChatInput = z.object({
  chatId: z.string().uuid().nullable().optional(),
  connectionId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(8000),
});

async function callGateway(
  messages: Array<z.infer<typeof MessageSchema>>,
  opts: { model?: string } = {},
): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Lovable AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
    }),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from AI.");
  return content;
}

// =========================
// Coach chat
// =========================
export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ensure a chat exists
    let chatId = data.chatId ?? null;
    if (!chatId) {
      const title = data.message.slice(0, 60);
      const { data: created, error } = await supabase
        .from("chats")
        .insert({ user_id: userId, title, connection_id: data.connectionId ?? null })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      chatId = created.id;
    }

    // Fetch prior history (last 30)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("chat_id", chatId!)
      .order("created_at", { ascending: true })
      .limit(30);

    const messages: Array<z.infer<typeof MessageSchema>> = [
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user", content: data.message },
    ];

    // Save user message
    await supabase.from("chat_messages").insert({
      chat_id: chatId!,
      user_id: userId,
      role: "user",
      content: data.message,
    });

    const reply = await callGateway(messages);

    await supabase.from("chat_messages").insert({
      chat_id: chatId!,
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    // Bump updated_at
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId!);

    return { chatId: chatId!, reply };
  });

export const getChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: chat, error } = await supabase
      .from("chats")
      .select("id, title, connection_id, created_at")
      .eq("id", data.chatId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!chat) throw new Error("Chat not found");
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("chat_id", data.chatId)
      .order("created_at", { ascending: true });
    return { chat, messages: messages ?? [] };
  });

// =========================
// Help Me Reply
// =========================
export const helpMeReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        received: z.string().min(1).max(4000),
        goal: z.string().max(1000).optional(),
        tone: z.string().max(60).optional(),
        history: z.string().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = `The user received this message:
"""
${data.received}
"""
${data.history ? `Prior conversation for context:\n"""\n${data.history}\n"""\n` : ""}
${data.goal ? `What they want to happen next: ${data.goal}` : ""}
${data.tone ? `Preferred tone: ${data.tone}` : ""}

Return exactly three distinct reply options that sound like a real person — natural, warm, respectful, and honest. Avoid clichés, cheesy lines, or over-clever wordplay. For each option, briefly note the vibe in one line (e.g. "Playful and light", "Direct and warm", "Curious and grounded") and then the message on the next line. Format:

1. [Vibe]
Message text

2. [Vibe]
Message text

3. [Vibe]
Message text

After the three options, add one short line labeled "Read on what's going on:" giving a fair, honest observation about the message and one thing to consider.`;

    const reply = await callGateway([
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ]);
    return { reply };
  });

// =========================
// Conversation Starter
// =========================
export const conversationStarter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        profileNotes: z.string().max(4000).optional(),
        datingApp: z.string().max(60).optional(),
        goal: z.string().max(500).optional(),
        tone: z.string().max(60).optional(),
        images: z
          .array(z.string().url().or(z.string().startsWith("data:")))
          .max(9)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const hasNotes = !!data.profileNotes?.trim();
    const hasImages = !!data.images?.length;
    if (!hasNotes && !hasImages) {
      throw new Error("Add profile notes or a screenshot to work from.");
    }

    const textPart = `The user wants to open a conversation on a dating app${data.datingApp ? ` (${data.datingApp})` : ""}.

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

After the three, add one short "Why these work:" line explaining what specifically they anchor on.`;

    const messages: Array<z.infer<typeof MessageSchema>> = [
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
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
  });

// =========================
// Screenshot Analysis (vision)
// =========================
export const analyzeScreenshots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        images: z.array(z.string().url().or(z.string().startsWith("data:"))).min(1).max(6),
        requestType: z.enum(["understand", "reply", "review"]).default("understand"),
        userContext: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const instruction =
      data.requestType === "reply"
        ? "The user wants three natural, respectful reply options they could send next. Also note tone shifts and anything ambiguous."
        : data.requestType === "review"
          ? "The user wants an honest review of how this conversation is going: what's working, what isn't, and one grounded next step."
          : "The user wants to understand what's going on in this conversation — tone, likely interpretations (multiple if ambiguous), and one grounded next step. Do not diagnose or label the other person.";

    const messages: Array<z.infer<typeof MessageSchema>> = [
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${instruction}${data.userContext ? `\n\nUser's own context: ${data.userContext}` : ""}\n\nRead the screenshots below carefully. Separate observable facts from interpretations.`,
          },
          ...data.images.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ],
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
  });

// =========================
// Profile Review
// =========================
export const reviewProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        whose: z.enum(["me", "connection"]).default("me"),
        datingApp: z.string().max(60).optional(),
        bio: z.string().max(4000).optional(),
        prompts: z.string().max(4000).optional(),
        goal: z.string().max(500).optional(),
        audience: z.string().max(500).optional(),
        whatIsntWorking: z.string().max(1000).optional(),
        photoUrls: z.array(z.string()).max(9).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const textPart = `Review a dating profile ${
      data.whose === "me" ? "for the user themselves" : "for someone they're connected with"
    }${data.datingApp ? ` on ${data.datingApp}` : ""}.

${data.bio ? `Bio:\n"""\n${data.bio}\n"""\n` : ""}
${data.prompts ? `Prompts / answers:\n"""\n${data.prompts}\n"""\n` : ""}
${data.goal ? `Relationship goal: ${data.goal}` : ""}
${data.audience ? `Who they'd like to attract: ${data.audience}` : ""}
${data.whatIsntWorking ? `What isn't working: ${data.whatIsntWorking}` : ""}

Give practical, honest feedback: what's working, what's flat or generic, and specific rewrites. If photos are attached, note what they communicate as a set (variety, energy, clarity) without evaluating attractiveness. Suggest one rewritten bio and up to three rewritten prompt answers. Keep it warm, not harsh.`;

    const messages: Array<z.infer<typeof MessageSchema>> = [
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
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
  });

// =========================
// Connection insights
// =========================
export const generateConnectionInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ connectionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conn, error: cErr } = await supabase
      .from("connections")
      .select("*")
      .eq("id", data.connectionId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!conn) throw new Error("Connection not found");

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
${(events ?? [])
  .map(
    (e) =>
      `- [${new Date(e.occurred_at).toISOString().slice(0, 10)}] (${e.event_type}) ${e.title}${
        e.body ? ` — ${e.body}` : ""
      }`,
  )
  .join("\n") || "(no events yet)"}

Give a short, honest pattern read: 2–4 observations (each 1–2 sentences), each grounded in specific timeline items. End with one grounded next step. Do NOT diagnose or label the other person. Separate facts from interpretations. If there's not enough context yet, say so briefly.`;

    const reply = await callGateway([
      { role: "system", content: CYRANO_SYSTEM_PROMPT },
      { role: "user", content: summary },
    ]);

    await supabase.from("connection_insights").insert({
      user_id: userId,
      connection_id: data.connectionId,
      observation: reply,
    });

    return { insight: reply };
  });
