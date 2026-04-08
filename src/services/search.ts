import { supabase } from "../lib/supabase";

export type SearchRow = {
  item_type: "decision" | "meeting" | "note";
  item_id: string;
  title: string | null;
  snippet: string | null;
  occurred_at: string;
};

export async function searchMemory(orgId: string, query: string) {
  const { data, error } = await supabase.rpc("search_memory", { p_org_id: orgId, p_query: query });
  if (error) throw error;
  return (data ?? []) as SearchRow[];
}

