import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";

import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONNECTION_STAGES, DATING_APPS } from "@/lib/dating-apps";
import { generateConnectionInsight } from "@/lib/ai-client";
import { FollowUp } from "@/components/FollowUp";
import { AnalysisToggle } from "@/components/AnalysisToggle";
import { useAnalysisMode } from "@/hooks/use-analysis-mode";
import { CyranoText } from "@/components/CyranoText";
import { CyranoDisclaimer } from "@/components/CyranoDisclaimer";

type Conn = {
  id: string;
  first_name: string | null;
  nickname: string | null;
  dating_app: string | null;
  where_met: string | null;
  stage: string;
  user_goal: string | null;
  important_context: string | null;
  known_boundaries: string | null;
  concerns: string | null;
  positive_developments: string | null;
};

type TimelineEvent = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  occurred_at: string;
};

type Insight = {
  id: string;
  observation: string;
  created_at: string;
  dismissed: boolean;
};

const EVENT_TYPES = [
  { value: "message", label: "Message exchange" },
  { value: "date", label: "Date" },
  { value: "call", label: "Call / video" },
  { value: "milestone", label: "Milestone" },
  { value: "concern", label: "Concern" },
  { value: "boundary", label: "Boundary set" },
  { value: "note", label: "Note" },
] as const;

export const Route = createFileRoute("/_authenticated/connections/$id")({
  head: () => ({
    meta: [
      { title: "Connection — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectionDetail,
});

function ConnectionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const insightFn = generateConnectionInsight;
  const { analysis, toggle: toggleAnalysis } = useAnalysisMode();

  const [conn, setConn] = useState<Conn | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insightsRef = useScrollToResult<HTMLElement>(insights.length > 0 && !genBusy);


  async function load() {
    setLoading(true);
    const [c, e, ins] = await Promise.all([
      supabase.from("connections").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("connection_timeline_events")
        .select("id, event_type, title, body, occurred_at")
        .eq("connection_id", id)
        .order("occurred_at", { ascending: false }),
      supabase
        .from("connection_insights")
        .select("id, observation, created_at, dismissed")
        .eq("connection_id", id)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    if (c.error) setError(c.error.message);
    setConn((c.data as Conn) ?? null);
    setEvents((e.data as TimelineEvent[]) ?? []);
    setInsights((ins.data as Insight[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function deleteConn() {
    if (!confirm("Delete this connection and all its history? This cannot be undone.")) return;
    const { error: err } = await supabase.from("connections").delete().eq("id", id);
    if (err) setError(err.message);
    else navigate({ to: "/connections" });
  }

  async function generateInsight() {
    setGenBusy(true);
    setError(null);
    try {
      await insightFn({ data: { connectionId: id, analysis } });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  async function dismissInsight(insightId: string) {
    await supabase.from("connection_insights").update({ dismissed: true }).eq("id", insightId);
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (!conn) {
    return (
      <div className="soft-card p-6">
        <p>Connection not found.</p>
        <Link to="/connections" className="mt-3 inline-block text-sm text-primary underline">
          Back to connections
        </Link>
      </div>
    );
  }

  const name = conn.nickname || conn.first_name || "Unnamed";

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/connections"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All connections
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl">{name}</h1>
            <p className="text-sm text-muted-foreground">
              {CONNECTION_STAGES.find((s) => s.value === conn.stage)?.label}
              {conn.dating_app ? ` · ${conn.dating_app}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Edit
            </button>
            <button
              onClick={deleteConn}
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <CyranoDisclaimer />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Context card */}
      <section className="soft-card space-y-2 p-5 text-sm">
        <ContextRow label="Your goal" value={conn.user_goal} />
        <ContextRow label="Important context" value={conn.important_context} />
        <ContextRow label="Known boundaries" value={conn.known_boundaries} />
        <ContextRow label="Concerns" value={conn.concerns} />
        <ContextRow label="Positive developments" value={conn.positive_developments} />
      </section>

      {/* Insights */}
      <section ref={insightsRef} className="scroll-mt-4 space-y-2">

        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg">Pattern insights</h2>
          <button
            onClick={generateInsight}
            disabled={genBusy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {genBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate
          </button>
        </div>
        <AnalysisToggle
          analysis={analysis}
          onToggle={toggleAnalysis}
          className="rounded-xl bg-muted/40 px-3 py-2"
        />
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Ask Cyrano to read the timeline and share honest patterns.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((i) => (
              <li key={i.id} className="space-y-2">
                <div className="soft-card p-4 text-sm">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(i.created_at).toLocaleString()}</span>
                    <button onClick={() => dismissInsight(i.id)} className="hover:text-foreground">
                      Dismiss
                    </button>
                  </div>
                  <CyranoText>{i.observation}</CyranoText>
                </div>
                <FollowUp
                  feature="Connection insight"
                  priorLabel="pattern read"
                  priorOutput={i.observation}
                  situationContext={`Connection: ${name}${conn.user_goal ? `\nGoal: ${conn.user_goal}` : ""}${conn.concerns ? `\nConcerns: ${conn.concerns}` : ""}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timeline */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg">Timeline</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> Add event
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here yet.</p>
        ) : (
          <ol className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="soft-card p-4 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{e.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(e.occurred_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {EVENT_TYPES.find((t) => t.value === e.event_type)?.label ?? e.event_type}
                </p>
                {e.body && <p className="mt-2 whitespace-pre-wrap text-sm">{e.body}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {showAdd && (
        <AddEventDialog
          connectionId={id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
        />
      )}

      {editing && conn && (
        <EditConnectionDialog
          conn={conn}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function AddEventDialog({
  connectionId,
  onClose,
  onSaved,
}: {
  connectionId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]["value"]>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setError("Not signed in");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.from("connection_timeline_events").insert({
      user_id: u.user.id,
      connection_id: connectionId,
      event_type: eventType,
      title,
      body: body || null,
      occurred_at: new Date(occurredAt).toISOString(),
    });
    setBusy(false);
    if (err) setError(err.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form onSubmit={save} className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6 shadow-lift">
        <h2 className="font-serif text-xl">Add timeline event</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Type</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as typeof eventType)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">When</span>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function EditConnectionDialog({
  conn,
  onClose,
  onSaved,
}: {
  conn: Conn;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    nickname: conn.nickname ?? "",
    dating_app: conn.dating_app ?? "",
    stage: conn.stage,
    user_goal: conn.user_goal ?? "",
    important_context: conn.important_context ?? "",
    known_boundaries: conn.known_boundaries ?? "",
    concerns: conn.concerns ?? "",
    positive_developments: conn.positive_developments ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error: err } = await supabase
      .from("connections")
      .update({
        nickname: f.nickname || null,
        dating_app: f.dating_app || null,
        stage: f.stage as never,
        user_goal: f.user_goal || null,
        important_context: f.important_context || null,
        known_boundaries: f.known_boundaries || null,
        concerns: f.concerns || null,
        positive_developments: f.positive_developments || null,
      })
      .eq("id", conn.id);
    setBusy(false);
    if (err) setError(err.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <form onSubmit={save} className="my-8 w-full max-w-md space-y-3 rounded-2xl bg-card p-6 shadow-lift">
        <h2 className="font-serif text-xl">Edit connection</h2>

        <TextField label="Name / nickname" value={f.nickname} onChange={(v) => setF({ ...f, nickname: v })} />
        <SelectField
          label="Dating platform"
          value={f.dating_app}
          onChange={(v) => setF({ ...f, dating_app: v })}
          options={[{ value: "", label: "—" }, ...DATING_APPS.map((a) => ({ value: a, label: a }))]}
        />
        <SelectField
          label="Stage"
          value={f.stage}
          onChange={(v) => setF({ ...f, stage: v })}
          options={CONNECTION_STAGES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <TextArea label="Your goal" value={f.user_goal} onChange={(v) => setF({ ...f, user_goal: v })} />
        <TextArea
          label="Important context"
          value={f.important_context}
          onChange={(v) => setF({ ...f, important_context: v })}
        />
        <TextArea
          label="Known boundaries"
          value={f.known_boundaries}
          onChange={(v) => setF({ ...f, known_boundaries: v })}
        />
        <TextArea label="Concerns" value={f.concerns} onChange={(v) => setF({ ...f, concerns: v })} />
        <TextArea
          label="Positive developments"
          value={f.positive_developments}
          onChange={(v) => setF({ ...f, positive_developments: v })}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
