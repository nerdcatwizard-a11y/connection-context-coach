import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { analyzeScreenshots } from "@/lib/ai.functions";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";

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

function ScreenshotsPage() {
  const call = useServerFn(analyzeScreenshots);
  const [images, setImages] = useState<string[]>([]);
  const [requestType, setRequestType] = useState<"understand" | "reply" | "review">("understand");
  const [userContext, setUserContext] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6 - images.length);
    const data = await Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            if (f.size > 6 * 1024 * 1024) {
              reject(new Error(`${f.name} is larger than 6MB.`));
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
    setImages((prev) => [...prev, ...data].slice(0, 6));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0) return;
    setError(null);
    setAnalysis(null);
    setBusy(true);
    try {
      const res = await call({ data: { images, requestType, userContext } });
      setAnalysis(res.analysis);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl">Read a Conversation</h1>
        <p className="text-sm text-muted-foreground">
          Upload up to 6 screenshots. Blur names or details you want to protect first.
        </p>
      </div>
      <CyranoDisclaimer />

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <div className="space-y-2">
          <span className="text-sm font-medium">Screenshots ({images.length}/6)</span>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`Screenshot ${i + 1}`} className="h-28 w-20 rounded-lg border border-border object-cover" />
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
            {images.length < 6 && (
              <label className="flex h-28 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
                <Upload className="h-4 w-4" />
                Add
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>

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
          disabled={busy || images.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Read the conversation
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {analysis && (
        <div className="soft-card space-y-2 p-5">
          <h2 className="font-serif text-lg">Cyrano's read</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</div>
        </div>
      )}
    </div>
  );
}
