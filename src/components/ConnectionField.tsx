import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type ConnectionOption = { id: string; name: string };

/**
 * Optional "First name or nickname" picker that links a feature's output
 * to a My Connections entry. Lets the user pick an existing connection or
 * create a new one inline.
 */
export function ConnectionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [items, setItems] = useState<ConnectionOption[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: err } = await supabase
      .from("connections")
      .select("id, first_name, nickname")
      .eq("archived", false)
      .order("updated_at", { ascending: false });
    if (err) setError(err.message);
    setItems(
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.nickname || c.first_name || "Unnamed",
      })),
    );
  }

  useEffect(() => {
    void load();
  }, []);

  async function createConnection() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setError("Not signed in");
      setBusy(false);
      return;
    }
    const { data, error: err } = await supabase
      .from("connections")
      .insert({ user_id: u.user.id, nickname: name })
      .select("id")
      .single();
    setBusy(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create connection");
      return;
    }
    setItems((prev) => [{ id: data.id, name }, ...(prev ?? [])]);
    onChange(data.id);
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-medium">
        First name or nickname{" "}
        <span className="font-normal text-muted-foreground">
          (optional, for connecting to{" "}
          <Link to="/connections" className="underline underline-offset-2 hover:text-foreground">
            My Connections
          </Link>
          )
        </span>
      </span>

      {!creating ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{items === null ? "Loading…" : "— None —"}</option>
            {(items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-sm hover:bg-accent"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createConnection();
              }
            }}
            placeholder="First name or nickname"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            disabled={busy || !newName.trim()}
            onClick={() => void createConnection()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="shrink-0 rounded-xl border border-border px-3 text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && (
        <p className="text-xs text-muted-foreground">
          Cyrano will save this to their{" "}
          <Link
            to="/connections/$id"
            params={{ id: value }}
            className="underline underline-offset-2 hover:text-foreground"
          >
            connection timeline
          </Link>
          .
        </p>
      )}
    </div>
  );
}
