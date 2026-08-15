import { createFileRoute } from "@tanstack/react-router";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { useCallback, useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { conversationStarter } from "@/lib/ai-client";
import { DATING_APPS } from "@/lib/dating-apps";
import { BackToDashboard } from "@/components/BackToDashboard";
import { AnalysisToggle } from "@/components/AnalysisToggle";
import { useAnalysisMode } from "@/hooks/use-analysis-mode";
import { CyranoText } from "@/components/CyranoText";
import { usePasteImages } from "@/hooks/use-paste-images";
import { FollowUp } from "@/components/FollowUp";
import { ConnectionField } from "@/components/ConnectionField";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";
import { logToConnection } from "@/lib/connection-log";

export const Route = createFileRoute("/_authenticated/conversation-starter")({
  head: () => ({
    meta: [
      { title: "Pickup Lines — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StarterPage,
});

const TONES = ["Warm", "Playful", "Curious", "Direct", "Flirty"];
const MAX = 10;

function StarterPage() {
  const call = conversationStarter;
  const { analysis, toggle: toggleAnalysis } = useAnalysisMode();
  const [profileNotes, setProfileNotes] = useState("");
  const [datingApp, setDatingApp] = useState("");
  const [tone, setTone] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [reply, setReply] = useState<string | null>(null);
  const resultRef = useScrollToResult(reply);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState("");

  const addFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const remaining = MAX - images.length;
    if (remaining <= 0) return;
    const arr = Array.from(files).slice(0, remaining);
    const data = await Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            if (f.size > 6 * 1024 * 1024) {
              reject(new Error(`${f.name || "Pasted image"} is larger than 6MB.`));
              return;
            }
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(new Error("Failed to read file"));
            r.readAsDataURL(f);
          }),
      ),
    ).catch((e) => {
      setError((e as Error).message);
      return [];
    });
    setImages((prev) => [...prev, ...data].slice(0, MAX));
  }, [images.length]);

  usePasteImages((files) => void addFiles(files));

  const canSubmit = profileNotes.trim().length > 0 || images.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setReply(null);
    setBusy(true);
    try {
      const res = await call({ data: { profileNotes, datingApp, tone, images, analysis } });
      setReply(res.reply);
      if (connectionId) {
        void logToConnection({ connectionId, title: "Cyrano: Conversation starters", body: res.reply });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <BackToDashboard />
      <div>
        <h1 className="font-serif text-2xl md:text-3xl">Pickup Lines</h1>
        <p className="text-sm text-muted-foreground">
          Describe the scenario you're in, or upload a screenshot of their dating profile bio — either one works, and you can do both. You'll get openers grounded in something real.
        </p>
      </div>
      <CyranoDisclaimer />

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Describe the scenario (or upload a bio screenshot below)
          </span>
          <textarea
            value={profileNotes}
            onChange={(e) => setProfileNotes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
            placeholder="Where you met or matched, what they're like, photos, prompts, bio details — whatever caught your attention"
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Bio / profile screenshots (optional)</span>
            <span className="text-xs text-muted-foreground">{images.length}/{MAX}</span>
          </div>
          {images.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center hover:bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Upload a screenshot of the bio</span>
              <span className="text-xs text-muted-foreground">or paste with ⌘/Ctrl+V — PNG or JPG up to 6MB</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void addFiles(e.target.files)}
              />
            </label>
          ) : (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Screenshot ${i + 1}`} className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => void addFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <ConnectionField value={connectionId} onChange={setConnectionId} />


        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Which platform? (optional)</span>
          <select
            value={datingApp}
            onChange={(e) => setDatingApp(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">—</option>
            {DATING_APPS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
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

        <AnalysisToggle analysis={analysis} onToggle={toggleAnalysis} className="rounded-xl bg-muted/40 px-3 py-2" />
        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get 3 openers
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reply && (
        <div ref={resultRef} className="scroll-mt-4 space-y-3">
          <div className="soft-card space-y-2 p-5">
            <h2 className="font-serif text-lg">Openers</h2>
            <div className="text-sm leading-relaxed">
              <CyranoText>{reply}</CyranoText>
            </div>
          </div>
          <FollowUp
            feature="Conversation Starter"
            priorLabel="openers"
            priorOutput={reply}
            situationContext={`${datingApp ? `App: ${datingApp}\n` : ""}${profileNotes ? `Profile notes: ${profileNotes}` : "(screenshots only)"}${tone ? `\nTone: ${tone}` : ""}`}
          />
        </div>
      )}
    </div>
  );
}
