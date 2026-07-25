import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { reviewProfile } from "@/lib/ai.functions";
import { DATING_APPS } from "@/lib/dating-apps";
import { BackToDashboard } from "@/components/BackToDashboard";
import { usePasteImages } from "@/hooks/use-paste-images";

export const Route = createFileRoute("/_authenticated/profile-review")({
  head: () => ({
    meta: [
      { title: "Review a Profile — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileReviewPage,
});

function ProfileReviewPage() {
  const call = useServerFn(reviewProfile);
  const [whose, setWhose] = useState<"me" | "connection">("me");
  const [datingApp, setDatingApp] = useState("");
  const [bio, setBio] = useState("");
  const [prompts, setPrompts] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [whatIsntWorking, setWhatIsntWorking] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const remaining = 9 - photos.length;
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
    setPhotos((prev) => [...prev, ...data].slice(0, 9));
  }, [photos.length]);

  usePasteImages((files) => void addFiles(files));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setBusy(true);
    try {
      const res = await call({
        data: {
          whose,
          datingApp,
          bio,
          prompts,
          goal,
          audience,
          whatIsntWorking,
          photoUrls: photos,
        },
      });
      setFeedback(res.feedback);
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
        <h1 className="font-serif text-2xl md:text-3xl">Review a Profile</h1>
        <p className="text-sm text-muted-foreground">
          Upload screenshots of your own dating profile — or one of someone you're interested in — for honest, practical feedback.
        </p>
      </div>

      <form onSubmit={submit} className="soft-card space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Upload profile screenshots</span>
            <span className="text-xs text-muted-foreground">{photos.length}/9</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Add photos of the profile — bio, prompts, pictures. You can also paste an image with ⌘/Ctrl+V.
          </p>
          {photos.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center hover:bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Tap to upload screenshots</span>
              <span className="text-xs text-muted-foreground">PNG or JPG, up to 6MB each</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          ) : (
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Screenshot ${i + 1}`} className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 9 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Whose profile is this?</span>
          <div className="flex gap-2">
            {(["me", "connection"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWhose(w)}
                className={
                  "rounded-full border px-4 py-1.5 text-sm " +
                  (whose === w
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent")
                }
              >
                {w === "me" ? "Mine" : "Someone I'm interested in"}
              </button>
            ))}
          </div>
        </div>

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
          <span className="text-sm font-medium">Bio (optional if screenshots include it)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste the bio here"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Prompts / answers (optional)</span>
          <textarea
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Prompt: answer&#10;Prompt: answer"
          />
        </label>


        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Relationship goal (optional)</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. serious partner, casual dating, take my time"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Who would you like to attract? (optional)</span>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe the kind of person"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">What isn't working? (optional)</span>
          <textarea
            value={whatIsntWorking}
            onChange={(e) => setWhatIsntWorking(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="No matches, wrong matches, no replies…"
          />
        </label>

        <button
          type="submit"
          disabled={busy || (!bio.trim() && photos.length === 0 && !prompts.trim())}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Review this profile
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {feedback && (
        <div className="soft-card space-y-2 p-5">
          <h2 className="font-serif text-lg">Cyrano's feedback</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{feedback}</div>
        </div>
      )}
    </div>
  );
}
