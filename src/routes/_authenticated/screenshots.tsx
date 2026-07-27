import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { analyzeScreenshots } from "@/lib/ai.functions";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";
import { BackToDashboard } from "@/components/BackToDashboard";
import { usePasteImages } from "@/hooks/use-paste-images";
import { FollowUp } from "@/components/FollowUp";
import { ConnectionField } from "@/components/ConnectionField";
import { logToConnection } from "@/lib/connection-log";

export const Route = createFileRoute("/_authenticated/screenshots")({
  head: () => ({
    meta: [
      { title: "Read a Conversation — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScreenshotsPage,
});

const REQUEST_LABELS: Record<"understand" | "reply" | "review", string> = {
  understand: "Help me understand what's going on",
  reply: "Suggest how I could reply",
  review: "Honest review of how this is going",
};

const MAX = 6;

async function filesToDataUrls(files: File[] | FileList): Promise<{ ok: string[]; error: string | null }> {
  const arr = Array.from(files);
  const ok: string[] = [];
  let error: string | null = null;
  for (const f of arr) {
    if (f.size > 6 * 1024 * 1024) {
      error = `${f.name || "Pasted image"} is larger than 6MB.`;
      continue;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(f);
      });
      ok.push(data);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  return { ok, error };
}

function ScreenshotsPage() {
  const call = useServerFn(analyzeScreenshots);
  const [images, setImages] = useState<string[]>([]);
  const [requestType, setRequestType] = useState<"understand" | "reply" | "review">("understand");
  const [userContext, setUserContext] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState("");

  const addFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const remaining = MAX - images.length;
    if (remaining <= 0) return;
    const slice = Array.from(files).slice(0, remaining);
    const { ok, error: err } = await filesToDataUrls(slice);
    if (err) setError(err);
    if (ok.length) setImages((prev) => [...prev, ...ok].slice(0, MAX));
  }, [images.length]);

  usePasteImages((files) => void addFiles(files));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0 && !userContext.trim()) return;
    setError(null);
    setAnalysis(null);
    setBusy(true);
    try {
      const res = await call({ data: { images, requestType, userContext } });
      setAnalysis(res.analysis);
      if (connectionId) {
        void logToConnection({ connectionId, title: "Cyrano: Read a Conversation", body: res.analysis });
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
        <h1 className="font-serif text-2xl md:text-3xl">Read a Conversation</h1>
        <p className="text-sm text-muted-foreground">
          Upload up to {MAX} screenshots — or paste one directly (⌘/Ctrl+V). Blur names you want to protect first.
        </p>
      </div>
      <CyranoDisclaimer />

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Conversation screenshots</span>
            <span className="text-xs text-muted-foreground">{images.length}/{MAX}</span>
          </div>
          {images.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center hover:bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Upload a screenshot of the conversation</span>
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
          <span className="text-sm font-medium">What do you want from Cyrano?</span>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as typeof requestType)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.keys(REQUEST_LABELS) as Array<keyof typeof REQUEST_LABELS>).map((k) => (
              <option key={k} value={k}>
                {REQUEST_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Anything else Cyrano should know? (optional)</span>
          <textarea
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Context, history, what you're feeling"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Submit
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {analysis && (
        <div className="space-y-3">
          <div className="soft-card space-y-2 p-5">
            <h2 className="font-serif text-lg">Cyrano's read</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</div>
          </div>
          <FollowUp
            feature="Read a Conversation"
            priorLabel="read of the conversation"
            priorOutput={analysis}
            situationContext={`Request: ${REQUEST_LABELS[requestType]}${userContext ? `\nUser context: ${userContext}` : ""}${images.length ? `\n(${images.length} screenshot(s) attached)` : ""}`}
          />
        </div>
      )}
    </div>
  );
}
