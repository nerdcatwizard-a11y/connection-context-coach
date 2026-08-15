import { createFileRoute } from "@tanstack/react-router";
import { BackToDashboard } from "@/components/BackToDashboard";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Entry = {
  id: string;
  title: string | null;
  body: string;
  mood: string | null;
  entry_date: string;
  favorite: boolean;
  created_at: string;
};

const MOODS = ["Hopeful", "Excited", "Calm", "Confused", "Anxious", "Disappointed", "Frustrated", "Hurt", "Proud"];

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: err } = await supabase
      .from("journal_entries")
      .select("id, title, body, mood, entry_date, favorite, created_at")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setEntries((data ?? []) as Entry[]);
  }
  useEffect(() => {
    void load();
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("journal_entries").delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-4">
      <BackToDashboard />
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">My Journal</h1>
          <p className="text-sm text-muted-foreground">
            A private place to reflect on how dating feels. Yours only.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>
      <CyranoDisclaimer />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {entries === null && (
        <div className="text-sm text-muted-foreground">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {entries && entries.length === 0 && (
        <div className="soft-card p-8 text-center text-sm text-muted-foreground">
          No entries yet. Reflection helps you notice patterns Cyrano can help with.
        </div>
      )}

      {entries && entries.length > 0 && (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="soft-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="font-serif text-lg">{e.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.entry_date).toLocaleDateString()}
                    {e.mood ? ` · ${e.mood}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => del(e.id)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{e.body}</p>
            </li>
          ))}
        </ul>
      )}

      {showNew && (
        <NewEntryDialog
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function NewEntryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setError("Not signed in");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.from("journal_entries").insert({
      user_id: u.user.id,
      title: title || null,
      body,
      mood: mood || null,
    });
    setBusy(false);
    if (err) setError(err.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-card p-6 shadow-lift">
        <h2 className="font-serif text-xl">New journal entry</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">What's on your mind? *</span>
          <textarea
            required
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
            placeholder="Write freely — no one else will read this."
          />
        </label>

        <div className="space-y-1">
          <span className="text-sm font-medium">Mood (optional)</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? "" : m)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (mood === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}
