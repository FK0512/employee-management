import { format } from "date-fns";

export default function MeetingList({
  items,
  onSelect
}: {
  items: any[];
  onSelect: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">No meetings yet.</div> : null}
      {items.map((m) => (
        <button
          key={m.id}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
          onClick={() => onSelect(m.id)}
        >
          <div className="text-sm font-semibold">{m.title}</div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">{format(new Date(m.occurred_at), "PP p")}</div>
        </button>
      ))}
    </div>
  );
}

