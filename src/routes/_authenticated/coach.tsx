import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { CyranoText } from "@/components/CyranoText";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { AnalysisToggle } from "@/components/AnalysisToggle";
import { useAnalysisMode } from "@/hooks/use-analysis-mode";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";
import { BackToDashboard } from "@/components/BackToDashboard";
import { sendCoachMessage, getChat } from "@/lib/ai-client";

const searchSchema = z.object({
  q: z.string().optional(),
  chat: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "Coach — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: CoachPage,
});

type Msg = { role: "user" | "assistant" | "system"; content: string; id?: string };

function CoachPage() {
  const { q, chat } = useSearch({ from: "/_authenticated/coach" });
  const send = sendCoachMessage;
  const load = getChat;
  const { analysis, toggle: toggleAnalysis } = useAnalysisMode();

  const [chatId, setChatId] = useState<string | null>(chat ?? null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (chat) {
      load({ data: { chatId: chat } })
        .then((res) => {
          setChatId(res.chat.id);
          setMessages(
            res.messages.map((m) => ({
              id: m.id,
              role: m.role as Msg["role"],
              content: m.content,
            })),
          );
        })
        .catch((e) => setError(e.message));
    }
  }, [chat, load]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const container = scrollRef.current;
    if (!container) return;
    if (last?.role === "assistant" && lastAssistantRef.current) {
      // Land at the TOP of Cyrano's answer, not the bottom.
      const top =
        lastAssistantRef.current.offsetTop - container.offsetTop - 8;
      container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (q && !seededRef.current) {
      seededRef.current = true;
      void submit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function submit(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await send({ data: { chatId, message: text, analysis } });
      setChatId(res.chatId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-3">
      <BackToDashboard />
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-2xl md:text-3xl">AI Coach</h1>
      </div>
      <CyranoDisclaimer />
      <AnalysisToggle
        analysis={analysis}
        onToggle={toggleAnalysis}
        className="rounded-xl bg-muted/40 px-3 py-2"
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl p-4 md:p-6">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-muted-foreground">
            Start by describing what's going on — a message you got, a situation, or a feeling
            you're sitting with.
          </p>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={m.id ?? i}
              ref={i === messages.length - 1 && m.role === "assistant" ? lastAssistantRef : undefined}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                (m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground")
              }
            >
              {m.role === "user" ? m.content : <CyranoText>{m.content}</CyranoText>}
            </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cyrano is thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
        className="flex items-end gap-2"
      >
        <AutoGrowTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit(input);
            }
          }}
          maxRows={8}
          placeholder="Message Cyrano…"
          autoFocus
          className="flex-1 rounded-xl border border-input bg-background px-4 py-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
