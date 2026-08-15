import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { ScreenshotUploader } from "@/components/ScreenshotUploader";
import { setPendingReplyImages } from "@/lib/pending-reply";
import { getUsage } from "@/lib/ai-client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Cyrano" },
      { name: "description", content: "Ask Cyrano for help with dating conversations, profiles, and connections." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [usage, setUsage] = useState<{ remaining: number; limit: number; unlimited: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { name?: string; full_name?: string } | undefined;
      setName(meta?.name || meta?.full_name || data.user?.email?.split("@")[0] || "");
    });
    getUsage().then(setUsage).catch(() => {});
  }, []);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    void navigate({ to: "/coach", search: { q: question } });
  }

  function goReply(next: string[]) {
    setImages(next);
    if (next.length === 0) return;
    setPendingReplyImages(next);
    void navigate({ to: "/help-me-reply", search: { auto: 1 } });
  }

  return (
    <div className="gradient-hero -mx-4 -mt-10 px-4 pt-10 md:-mx-8 md:px-8">
      <section className="soft-card flex h-[calc(100dvh-7rem)] flex-col p-3 md:h-[calc(100dvh-3rem)]">
        <div className="flex flex-col items-center gap-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground md:h-14 md:w-14">
            <Sparkle className="h-5 w-5 md:h-8 md:w-8" />
          </span>
          <span className="font-serif text-xl md:text-3xl">Cyrano</span>
          <p className="text-[10px] text-muted-foreground md:text-xs">Your Dating Assistant</p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2 py-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {greeting()}{name ? `, ${name}` : ""}
            </p>
            <h1 className="mt-0.5 font-serif text-lg md:text-2xl">What can I help you with?</h1>
            <form onSubmit={ask} className="mt-2 flex flex-col gap-2 sm:flex-row">
              <AutoGrowTextarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask Cyrano anything…"
                rows={1}
                maxRows={2}
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-xs focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-95"
              >
                Ask Cyrano <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1.5 text-[10px] text-muted-foreground md:text-xs">
              {usage?.unlimited ? (
                "Unlimited AI messages."
              ) : (
                <>
                  {usage
                    ? `${usage.remaining} of ${usage.limit} messages left today.`
                    : "Free plan: 10 AI messages per day."}{" "}
                  <Link to="/pricing" className="text-primary hover:underline">Upgrade for unlimited</Link>.
                </>
              )}
            </p>
          </div>

          <div className="space-y-1.5 border-t border-border pt-2">
            <h2 className="font-serif text-sm md:text-lg">How do I respond to this text?</h2>
            {images.length > 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Taking you to Help Me Reply…
              </p>
            ) : (
              <ScreenshotUploader
                images={images}
                onChange={goReply}
                max={10}
                title="Upload photos (up to 10)"
                label="Upload photos"
                showPasteHint={false}
                dropClassName="h-16 md:h-28"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
