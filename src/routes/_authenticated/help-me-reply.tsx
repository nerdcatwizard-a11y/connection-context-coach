import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { helpMeReply } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/help-me-reply")({
  head: () => ({
    meta: [
      { title: "Help Me Reply — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpMeReplyPage,
});

const TONES = ["Warm", "Playful", "Direct", "Curious", "Flirty", "Grounded"];

function HelpMeReplyPage() {
  const call = useServerFn(helpMeReply);
  const [received, setReceived] = useState("");
  const [history, setHistory] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState<string>("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReply(null);
    setBusy(true);
    try {
      const res = await call({ data: { received, goal, tone, history } });
      setReply(res.reply);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl">Help Me Reply</h1>
        <p className="text-sm text-muted-foreground">
          Paste what you received. Cyrano will offer three natural, respectful options.
        </p>
      </div>

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <Field label="What did they send you? *">
          <textarea
            required
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste their message here…"
          />
        </Field>
        <Field label="Any prior conversation for context? (optional)">
          <textarea
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Optional — what came before this message"
          />
        </Field>
        <Field label="What do you want to happen next? (optional)">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. keep it going, ask them out, slow things down"
          />
        </Field>
        <Field label="Preferred tone (optional)">
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(tone === t ? "" : t)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (tone === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <button
          type="submit"
          disabled={busy || !received.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get 3 options
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reply && (
        <div className="soft-card space-y-2 p-5">
          <h2 className="font-serif text-lg">Your options</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
