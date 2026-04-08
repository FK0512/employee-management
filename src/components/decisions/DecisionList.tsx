import { format } from "date-fns";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function DecisionList({
  items,
  onDelete
}: {
  items: any[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? <div className="text-sm text-[rgb(var(--muted))]">No matching decisions.</div> : null}
      {items.map((d) => (
        <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">{d.title}</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">{format(new Date(d.decided_at), "PP p")}</div>
            </div>
            <Button variant="ghost" onClick={() => onDelete(d.id)}>
              Delete
            </Button>
          </div>
          {d.why ? (
            <div className="mt-3">
              <Badge>Why</Badge>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/90">{d.why}</p>
            </div>
          ) : null}
          {d.description ? (
            <div className="mt-3">
              <Badge>Description</Badge>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{d.description}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

