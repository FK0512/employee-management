import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useSessionStore } from "../context/sessionStore";
import { deleteDecision, listDecisions } from "../services/decisions";
import { supabase } from "../lib/supabase";
import CreateDecisionModal from "../components/decisions/CreateDecisionModal";
import DecisionList from "../components/decisions/DecisionList";

export default function DecisionsPage() {
  const orgId = useSessionStore((s) => s.activeOrganizationId)!;
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (d) => (d.title ?? "").toLowerCase().includes(query) || (d.why ?? "").toLowerCase().includes(query)
    );
  }, [items, q]);

  async function refresh() {
    const data = await listDecisions(orgId);
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    refresh().catch((e: any) => setError(e.message ?? "Failed to load decisions."));

    const channel = supabase
      .channel(`decisions:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "decisions", filter: `organization_id=eq.${orgId}` },
        () => {
          if (cancelled) return;
          refresh().catch((e: any) => setError(e.message ?? "Failed to refresh decisions."));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Decisions</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Record what we decided, and why.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title or why..." className="w-64" />
          <Button onClick={() => setOpen(true)}>New</Button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

      <Card title="Decision log" subtitle={`${filtered.length} items`}>
        <DecisionList
          items={filtered}
          onDelete={async (id) => {
            try {
              await deleteDecision(orgId, id);
              await refresh();
            } catch (e: any) {
              setError(e.message ?? "Failed to delete.");
            }
          }}
        />
      </Card>

      <CreateDecisionModal
        open={open}
        onClose={() => setOpen(false)}
        orgId={orgId}
        onCreated={async () => {
          setOpen(false);
          await refresh();
        }}
      />
    </div>
  );
}
