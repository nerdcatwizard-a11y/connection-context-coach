import { supabase } from "@/integrations/supabase/client";

/**
 * Save a Cyrano output to a connection's timeline so features
 * feed into My Connections.
 */
export async function logToConnection({
  connectionId,
  title,
  body,
}: {
  connectionId: string;
  title: string;
  body: string;
}) {
  if (!connectionId) return;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("connection_timeline_events").insert({
    user_id: u.user.id,
    connection_id: connectionId,
    event_type: "note",
    title,
    body,
  });
  await supabase
    .from("connections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", connectionId);
}
