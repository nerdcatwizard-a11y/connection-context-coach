import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { CyranoText } from "@/components/CyranoText";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { askFollowUp } from "@/lib/ai.functions";

type Turn = { role: "user" | "assistant"; content: string };

export function FollowUp({
  feature,
  priorLabel,
  priorOutput,
  situationContext,
}: {
  feature: string;
  priorLabel?: string;
  priorOutput: string;
  situationContext?: string;
}) {
  const call = useServerFn(askFollowUp);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setError(null);
    setBusy(true);
    const nextHistory = [...turns, { role: "user" as const, content: question }];
    setTurns(nextHistory);
    setQ("");
    try {
      const res = await call({
        data: {
          feature,
          priorLabel,
          priorOutput,
          situationContext,
          history: turns,
          question,
        },
      });
      setTurns([...nextHistory, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError((err as Error).message);
      setTurns(turns);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Follow-up with Cyrano</h3>
      </div>


      {turns.length > 0 && (
        <div className="space-y-2">
          {turns.map((t, i) => (
            <div
              key={i}
              className={
                t.role === "user"
                  ? "ml-6 rounded-2xl bg-primary/10 px-3 py-2 text-sm"
                  : "mr-6 rounded-2xl bg-muted/60 px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed"
              }
            >
              {t.role === "user" ? t.content : <CyranoText>{t.content}</CyranoText>}
            </div>
          ))}
          {busy && (
            <div className="mr-6 inline-flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Cyrano is thinking…
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <form onSubmit={send} className="flex items-end gap-2">
        <AutoGrowTextarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e as unknown as React.FormEvent);
            }
          }}
          maxRows={10}
          placeholder="Ask anything about the response above…"
          className="flex-1 rounded-xl border border-input bg-background p-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !q.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask Cyrano
        </button>
      </form>
    </div>
  );
}
