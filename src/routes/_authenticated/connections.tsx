import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DATING_APPS, CONNECTION_STAGES } from "@/lib/dating-apps";

type Connection = {
  id: string;
  first_name: string | null;
  nickname: string | null;
  dating_app: string | null;
  stage: string;
  updated_at: string;
};

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({
    meta: [
      { title: "Connections — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const [items, setItems] = useState<Connection[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: err } = await supabase
      .from("connections")
      .select("id, first_name, nickname, dating_app, stage, updated_at")
      .eq("archived", false)
      .order("updated_at", { ascending: false });
    if (err) setError(err.message);
    setItems((data ?? []) as Connection[]);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">My Connections</h1>
          <p className="text-sm text-muted-foreground">
            Private context per person, so Cyrano's advice stays relevant.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {items === null && (
        <div className="text-sm text-muted-foreground">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="soft-card flex flex-col items-center gap-3 p-8 text-center">
          <Users className="h-8 w-8 text-primary" />
          <p className="font-serif text-lg">No connections yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add someone you're talking to, dating, or unsure about. Cyrano will use this to give
            more grounded advice over time.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Add your first connection
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                to="/connections/$id"
                params={{ id: c.id }}
                className="soft-card flex items-center justify-between gap-3 p-4 transition hover:shadow-lift"
              >
                <div className="min-w-0">
                  <p className="font-serif text-lg">
                    {c.nickname || c.first_name || "Unnamed"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stageLabel(c.stage)}
                    {c.dating_app ? ` · ${c.dating_app}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showNew && (
        <NewConnectionDialog
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function stageLabel(v: string) {
  return CONNECTION_STAGES.find((s) => s.value === v)?.label ?? v;
}

function NewConnectionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [nickname, setNickname] = useState("");
  const [datingApp, setDatingApp] = useState("");
  const [stage, setStage] = useState<string>("new_match");
  const [userGoal, setUserGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setError("Not signed in");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.from("connections").insert({
      user_id: u.user.id,
      first_name: firstName || null,
      nickname: nickname || null,
      dating_app: datingApp || null,
      stage: stage as never,
      user_goal: userGoal || null,
    });
    setBusy(false);
    if (err) setError(err.message);
    else onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6 shadow-lift"
      >
        <h2 className="font-serif text-xl">Add a connection</h2>
        <p className="text-xs text-muted-foreground">
          Use a first name or a private label — this is only visible to you.
        </p>

        <Field label="First name or nickname *">
          <input
            required
            value={nickname || firstName}
            onChange={(e) => {
              setNickname(e.target.value);
              setFirstName("");
            }}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Where did you meet?">
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
        </Field>

        <Field label="Stage">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {CONNECTION_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="What do you want out of this? (optional)">
          <textarea
            rows={2}
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. see if there's real potential"
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
