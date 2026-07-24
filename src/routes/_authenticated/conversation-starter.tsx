import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { conversationStarter } from "@/lib/ai.functions";
import { DATING_APPS } from "@/lib/dating-apps";

export const Route = createFileRoute("/_authenticated/conversation-starter")({
  head: () => ({
    meta: [
      { title: "Conversation Starter — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StarterPage,
});

const TONES = ["Warm", "Playful", "Curious", "Direct", "Flirty"];

function StarterPage() {
  const call = useServerFn(conversationStarter);
  const [profileNotes, setProfileNotes] = useState("");
  const [datingApp, setDatingApp] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReply(null);
    setBusy(true);
    try {
      const res = await call({ data: { profileNotes, datingApp, goal, tone } });
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
        <h1 className="font-serif text-2xl md:text-3xl">Help Me Get the Conversation Started</h1>
        <p className="text-sm text-muted-foreground">
          Tell Cyrano what you noticed about their profile. You'll get openers grounded in something
          real — no clichés.
        </p>
      </div>

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            What did you notice about their profile? *
          </span>
          <textarea
            required
            value={profileNotes}
            onChange={(e) => setProfileNotes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Photos, prompts, bio details — whatever caught your attention"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Which app? (optional)</span>
          <select
            value={datingApp}
            onChange={(e) => setDatingApp(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">—</option>
            {DATING_APPS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">What are you hoping for? (optional)</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. see if there's a spark, land a first date"
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Preferred tone (optional)</span>
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
        </div>

        <button
          type="submit"
          disabled={busy || !profileNotes.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get 3 openers
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reply && (
        <div className="soft-card space-y-2 p-5">
          <h2 className="font-serif text-lg">Openers</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</div>
        </div>
      )}
    </div>
  );
}
