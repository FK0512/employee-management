import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useSessionStore } from "../context/sessionStore";
import { listRecentDecisions } from "../services/decisions";
import { listRecentMeetings } from "../services/meetings";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";

export default function DashboardPage() {
  const orgId = useSessionStore((s) => s.activeOrganizationId)!;
  const [org, setOrg] = useState<{ name: string; join_code: string } | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, m, o] = await Promise.all([
          listRecentDecisions(orgId),
          listRecentMeetings(orgId),
          supabase.from("organizations").select("name, join_code").eq("id", orgId).single()
        ]);
        if (cancelled) return;
        setDecisions(d);
        setMeetings(m);
        if (o.error) throw o.error;
        setOrg(o.data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load dashboard.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Recent activity across your organization memory.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {org ? <Badge>{org.name}</Badge> : null}
          {org ? (
            <button
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[rgb(var(--muted))] hover:bg-white/10"
              onClick={async () => {
                await navigator.clipboard.writeText(org.join_code);
              }}
              title="Click to copy join code"
              type="button"
            >
              Join code: {org.join_code}
            </button>
          ) : (
            <Badge>Org: {orgId.slice(0, 8)}...</Badge>
          )}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Recent decisions" subtitle="The “why” behind the work.">
          <div className="space-y-3">
            {decisions.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">No decisions yet.</div> : null}
            {decisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="mt-1 text-xs text-[rgb(var(--muted))]">{format(new Date(d.decided_at), "PP p")}</div>
                {d.why ? <div className="mt-2 text-sm text-white/90">{d.why}</div> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent meetings" subtitle="Notes and context you can search later.">
          <div className="space-y-3">
            {meetings.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">No meetings yet.</div> : null}
            {meetings.map((m) => (
              <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">{m.title}</div>
                <div className="mt-1 text-xs text-[rgb(var(--muted))]">{format(new Date(m.occurred_at), "PP p")}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
