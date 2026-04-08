import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useSessionStore } from "../context/sessionStore";
import { deleteMeeting, getMeeting, listMeetings } from "../services/meetings";
import { supabase } from "../lib/supabase";
import CreateMeetingModal from "../components/meetings/CreateMeetingModal";
import MeetingList from "../components/meetings/MeetingList";
import MeetingDetails from "../components/meetings/MeetingDetails";

export default function MeetingsPage() {
  const orgId = useSessionStore((s) => s.activeOrganizationId)!;
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((m) => (m.title ?? "").toLowerCase().includes(query));
  }, [items, q]);

  async function refresh() {
    const data = await listMeetings(orgId);
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    refresh().catch((e: any) => setError(e.message ?? "Failed to load meetings."));

    const channel = supabase
      .channel(`meetings:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings", filter: `organization_id=eq.${orgId}` },
        () => {
          if (cancelled) return;
          refresh().catch((e: any) => setError(e.message ?? "Failed to refresh meetings."));
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
          <h1 className="text-2xl font-semibold">Meetings</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Capture notes. Voice-to-text can plug in later; the storage is ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title..." className="w-64" />
          <Button onClick={() => setOpen(true)}>New</Button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
        <Card title="Meeting list" subtitle={`${filtered.length} items`}>
          <MeetingList
            items={filtered}
            onSelect={async (id) => {
              try {
                const full = await getMeeting(orgId, id);
                setSelected(full);
              } catch (e: any) {
                setError(e.message ?? "Failed to load meeting.");
              }
            }}
          />
        </Card>

        <Card title="Meeting details" subtitle="Select a meeting to view notes.">
          <MeetingDetails
            meeting={selected}
            onDelete={async () => {
              if (!selected) return;
              try {
                await deleteMeeting(orgId, selected.id);
                setSelected(null);
                await refresh();
              } catch (e: any) {
                setError(e.message ?? "Failed to delete.");
              }
            }}
          />
        </Card>
      </div>

      <CreateMeetingModal
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
