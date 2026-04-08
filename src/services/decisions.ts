import { supabase } from "../lib/supabase";

export type DecisionCreate = {
  organization_id: string;
  title: string;
  description?: string;
  why?: string;
  decided_at?: string;
  created_by: string;
  tags?: string[];
};

export async function listRecentDecisions(orgId: string) {
  const { data, error } = await supabase
    .from("decisions")
    .select("id, title, why, description, decided_at, created_at")
    .eq("organization_id", orgId)
    .order("decided_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function listDecisions(orgId: string) {
  const { data, error } = await supabase
    .from("decisions")
    .select("id, title, why, description, decided_at, created_at")
    .eq("organization_id", orgId)
    .order("decided_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

async function upsertTags(orgId: string, tagNames: string[]) {
  const cleaned = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean).map((t) => t.toLowerCase()))].slice(0, 12);
  if (cleaned.length === 0) return [];

  const { data: inserted, error: insertErr } = await supabase
    .from("tags")
    .upsert(
      cleaned.map((name) => ({ organization_id: orgId, name })),
      { onConflict: "organization_id,name" }
    )
    .select("id, name");
  if (insertErr) throw insertErr;
  return inserted ?? [];
}

export async function createDecision(input: DecisionCreate) {
  const insertPayload: {
    organization_id: string;
    title: string;
    description: string | null;
    why: string | null;
    created_by: string;
    decided_at?: string;
  } = {
    organization_id: input.organization_id,
    title: input.title,
    description: input.description ?? null,
    why: input.why ?? null,
    created_by: input.created_by
  };

  // Let Postgres default (`now()`) apply when not explicitly provided.
  if (input.decided_at) insertPayload.decided_at = input.decided_at;

  const { data: decision, error } = await supabase
    .from("decisions")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;

  const tags = await upsertTags(input.organization_id, input.tags ?? []);
  if (tags.length > 0) {
    const { error: joinErr } = await supabase.from("decision_tags").insert(
      tags.map((t) => ({
        decision_id: decision.id,
        tag_id: t.id
      }))
    );
    if (joinErr) throw joinErr;
  }

  return decision;
}

export async function deleteDecision(orgId: string, id: string) {
  const { error } = await supabase.from("decisions").delete().eq("organization_id", orgId).eq("id", id);
  if (error) throw error;
}
