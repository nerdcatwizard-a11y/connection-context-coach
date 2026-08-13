import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DATING_APPS } from "@/lib/dating-apps";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Cyrano" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Welcome,
});

const HELP_WITH = [
  "Reply help on dating platforms",
  "Starting conversations",
  "Reading between the lines",
  "Moving toward a date",
  "Profile feedback",
  "Reflecting on patterns",
];

const TONES = ["Warm", "Playful", "Direct", "Thoughtful", "Confident", "Casual"];

const STEPS = ["about_you", "goals", "writelikeme"] as const;

const ABOUT_YOU_GROUPS: { key: string; label: string; options: string[] }[] = [
  {
    key: "vibe",
    label: "Which words feel most like you?",
    options: ["Introverted", "Extroverted", "Curious", "Creative", "Adventurous", "Homebody", "Empathetic", "Independent"],
  },
  {
    key: "headspace",
    label: "Where's your headspace right now?",
    options: ["Feeling hopeful", "A little burnt out", "Getting back out there", "Healing from something", "Just exploring", "Ready for something real"],
  },
];

function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [aboutYou, setAboutYou] = useState<Record<string, string[]>>({});
  const [helpWith, setHelpWith] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");
  const [writeLike, setWriteLike] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const total = STEPS.length;
  const key = STEPS[step];

  async function finish(skipped = false) {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) throw new Error("Not signed in");
      const aboutYouFlat = Object.values(aboutYou).flat();
      if (aboutYouFlat.length) {
        await supabase.auth.updateUser({ data: { about_you: aboutYou } });
      }
      await supabase.from("user_preferences").upsert({
        user_id: uid,
        help_with: helpWith.length ? helpWith : null,
        dating_apps: apps.length ? apps : null,
        relationship_goal: goal || null,
        preferred_tone: tone || null,
        writelikeme_enabled: writeLike ?? false,
        onboarding_skipped: skipped,
      });
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", uid);
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const toggleAbout = (group: string, v: string) => {
    setAboutYou((prev) => {
      const cur = prev[group] ?? [];
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return { ...prev, [group]: next };
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="soft-card p-6 md:p-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {total}</span>
          <button onClick={() => finish(true)} className="rounded-full border border-border px-3 py-1 hover:bg-accent">
            Skip &amp; start using Cyrano
          </button>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Cyrano — your dating assistant
        </p>
        <h1 className="mt-2 font-serif text-2xl">Welcome to Cyrano</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every question is optional — answer what you'd like and skip the rest.
        </p>

        <div className="mt-6">
          {key === "about_you" && (
            <div className="space-y-6">
              {ABOUT_YOU_GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="text-sm font-medium">{g.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const active = (aboutYou[g.key] ?? []).includes(o);
                      return (
                        <button
                          key={o}
                          onClick={() => toggleAbout(g.key, o)}
                          className={`rounded-full border px-3 py-1.5 text-sm ${
                            active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-sm font-medium">Which dating platforms are you on?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DATING_APPS.map((o) => {
                    const active = apps.includes(o);
                    return (
                      <button
                        key={o}
                        onClick={() => toggle(apps, o, setApps)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {key === "goals" && (
            <div className="space-y-6">
              <MultiSelect label="What would you most like help with?" options={HELP_WITH} selected={helpWith} onToggle={(v) => toggle(helpWith, v, setHelpWith)} />
              <SingleSelect
                label="What type of relationship are you seeking?"
                options={["Something casual", "Dating with intention", "A long-term relationship", "Not sure yet"]}
                value={goal}
                onChange={setGoal}
              />
              <SingleSelect label="What tone should Cyrano use with you?" options={TONES} value={tone} onChange={setTone} />
            </div>
          )}
          {key === "writelikeme" && (
            <div>
              <p className="text-sm font-medium">Would you like Cyrano to learn your texting style?</p>
              <p className="mt-1 text-xs text-muted-foreground">You can add example messages later in Account settings. Nothing is used without your permission.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setWriteLike(true)}
                  className={`rounded-full border px-4 py-2 text-sm ${writeLike === true ? "bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                >
                  Yes, learn my style
                </button>
                <button
                  onClick={() => setWriteLike(false)}
                  className={`rounded-full border px-4 py-2 text-sm ${writeLike === false ? "bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                >
                  Not now
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => (step < total - 1 ? setStep(step + 1) : finish())}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Skip
            </button>
            <button
              onClick={() => (step < total - 1 ? setStep(step + 1) : finish())}
              disabled={busy}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {step < total - 1 ? "Continue" : "Finish"}
            </button>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
        I'm Cyrano, your dating assistant and AI dating and relationship coach. I
        can offer educational guidance and help you think through dating app
        situations, but I'm not a licensed therapist or mental-health professional. If
        something feels urgent, please reach out to local emergency services or a trusted
        person.
      </p>
    </div>
  );
}

function MultiSelect({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">Choose any that apply.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SingleSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
