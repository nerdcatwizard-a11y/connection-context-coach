import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Sparkles } from "lucide-react";
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

type Option = { label: string; message: string };

function parseOptions(reply: string): { options: Option[]; footer: string | null } {
  // Split into blocks starting with "1." / "2." / "3."
  const trimmed = reply.trim();
  const regex = /^\s*(\d+)[\.\)]\s*(.*)$/gm;
  const matches: { index: number; header: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(trimmed)) !== null) {
    matches.push({ index: Number(m[1]), header: m[2].trim(), start: m.index });
  }
  if (matches.length < 2) return { options: [], footer: null };

  const options: Option[] = [];
  let footerStart = trimmed.length;
  for (let i = 0; i < matches.length; i++) {
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : trimmed.length;
    const block = trimmed.slice(matches[i].start, nextStart).trim();
    const lines = block.split("\n");
    const first = lines[0].replace(/^\s*\d+[\.\)]\s*/, "").trim();
    const rest = lines.slice(1).join("\n").trim();
    // Header may be "[Vibe]" or plain vibe label
    let label = first.replace(/^\[|\]$/g, "").trim() || `Option ${i + 1}`;
    let message = rest;
    if (!message) {
      // No second line — treat entire first line as the message
      message = first;
      label = `Option ${i + 1}`;
    }
    options.push({ label, message });
    // Look for footer keyword after the last block
    if (i === matches.length - 1) {
      const footerIdx = block.search(/\n\s*(read on|why these|why this|note|context)/i);
      if (footerIdx > -1) {
        const foot = block.slice(footerIdx).trim();
        options[options.length - 1].message = block
          .slice(block.indexOf("\n") + 1, footerIdx)
          .trim();
        footerStart = matches[i].start + block.length - foot.length;
      }
    }
  }
  const footer = footerStart < trimmed.length ? trimmed.slice(footerStart).trim() : null;
  return { options, footer };
}

function HelpMeReplyPage() {
  const call = useServerFn(helpMeReply);
  const [received, setReceived] = useState("");
  const [history, setHistory] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState<string>("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const { options, footer } = useMemo(
    () => (reply ? parseOptions(reply) : { options: [], footer: null }),
    [reply],
  );

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

  async function copyText(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-4">
      <Link
        to="/home"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

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
        <div className="space-y-3">
          <h2 className="font-serif text-lg">Your options</h2>
          {options.length > 0 ? (
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="soft-card space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">
                      {opt.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(opt.message, i)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                    >
                      {copiedIdx === i ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{opt.message}</p>
                </div>
              ))}
              {footer && (
                <div className="soft-card p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {footer}
                </div>
              )}
            </div>
          ) : (
            <div className="soft-card space-y-2 p-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => copyText(reply, 0)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                >
                  {copiedIdx === 0 ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</div>
            </div>
          )}
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
