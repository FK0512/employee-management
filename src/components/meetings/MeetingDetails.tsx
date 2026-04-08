import { format } from "date-fns";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function MeetingDetails({
  meeting,
  onDelete
}: {
  meeting: any | null;
  onDelete: () => Promise<void>;
}) {
  if (!meeting) {
    return <div className="text-sm text-[rgb(var(--muted))]">Pick a meeting from the list.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{meeting.title}</div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">{format(new Date(meeting.occurred_at), "PP p")}</div>
        </div>
        <Button variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>Voice-to-text placeholder</Badge>
        <Badge>Attachments ready (next)</Badge>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
        <div className="text-xs text-[rgb(var(--muted))]">Notes</div>
        {meeting.meeting_notes?.length ? (
          <pre className="mt-2 whitespace-pre-wrap text-sm text-white/90">{meeting.meeting_notes[0].content}</pre>
        ) : (
          <div className="mt-2 text-sm text-[rgb(var(--muted))]">No notes captured.</div>
        )}
      </div>
    </div>
  );
}

