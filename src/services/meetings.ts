import { supabase } from "../lib/supabase";

export async function listRecentMeetings(orgId: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, occurred_at, created_at")
    .eq("organization_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function listMeetings(orgId: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, occurred_at, created_at")
    .eq("organization_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getMeeting(orgId: string, meetingId: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, occurred_at, created_at, meeting_notes ( id, content, created_at )")
    .eq("organization_id", orgId)
    .eq("id", meetingId)
    .single();
  if (error) throw error;
  return data;
}

export async function createMeeting(input: {
  organization_id: string;
  title: string;
  occurred_at?: string;
  notes?: string;
  created_by: string;
}) {
  const insertPayload: {
    organization_id: string;
    title: string;
    created_by: string;
    occurred_at?: string;
  } = {
    organization_id: input.organization_id,
    title: input.title,
    created_by: input.created_by
  };

  // Let Postgres default (`now()`) apply when not explicitly provided.
  if (input.occurred_at) insertPayload.occurred_at = input.occurred_at;

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;

  if (input.notes && input.notes.trim().length > 0) {
    const { error: noteErr } = await supabase.from("meeting_notes").insert({
      meeting_id: meeting.id,
      content: input.notes,
      created_by: input.created_by
    });
    if (noteErr) throw noteErr;
  }

  return meeting;
}

export async function deleteMeeting(orgId: string, id: string) {
  const { error } = await supabase.from("meetings").delete().eq("organization_id", orgId).eq("id", id);
  if (error) throw error;
}
