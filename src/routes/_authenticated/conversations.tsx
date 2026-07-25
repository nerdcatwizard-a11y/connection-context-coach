import { createFileRoute, Link } from "@tanstack/react-router";
import { BackToDashboard } from "@/components/BackToDashboard";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Chat = {
  id: string;
  title: string | null;
  updated_at: string;
};

export const Route = createFileRoute("/_authenticated/conversations")({
  head: () => ({
    meta: [
      { title: "History — Cyrano - Dating Coach" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConversationsPage,
});

function ConversationsPage() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: err } = await supabase
      .from("chats")
      .select("id, title, updated_at")
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (err) setError(err.message);
    setChats((data ?? []) as Chat[]);
  }
  useEffect(() => {
    void load();
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await supabase.from("chats").delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl">Conversation History</h1>
        <p className="text-sm text-muted-foreground">Your past chats with Cyrano.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {chats === null && (
        <div className="text-sm text-muted-foreground">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {chats && chats.length === 0 && (
        <div className="soft-card p-8 text-center text-sm text-muted-foreground">
          No chats yet.{" "}
          <Link to="/coach" className="text-primary underline">
            Start one
          </Link>
          .
        </div>
      )}

      {chats && chats.length > 0 && (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.id} className="soft-card flex items-center justify-between gap-2 p-4">
              <Link
                to="/coach"
                search={{ chat: c.id }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.updated_at).toLocaleString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => del(c.id)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
