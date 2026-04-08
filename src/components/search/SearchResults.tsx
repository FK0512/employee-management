import { format } from "date-fns";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function SearchResults({ rows }: { rows: any[] }) {
  return (
    <Card title="Results" subtitle={`${rows.length} matches`}>
      <div className="space-y-3">
        {rows.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">No results yet.</div> : null}
        {rows.map((r) => (
          <div key={`${r.item_type}:${r.item_id}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{r.item_type}</Badge>
              <div className="text-sm font-semibold">{r.title ?? "(untitled)"}</div>
              <div className="text-xs text-[rgb(var(--muted))]">{format(new Date(r.occurred_at), "PP p")}</div>
            </div>
            {r.snippet ? <p className="mt-2 whitespace-pre-wrap text-sm text-white/85">{r.snippet}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

