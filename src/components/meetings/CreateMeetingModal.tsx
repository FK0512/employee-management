import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";
import { createMeeting } from "../../services/meetings";

export default function CreateMeetingModal({
  open,
  onClose,
  orgId,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setNotes("");
    setError(null);
    setLoading(false);
  }, [open]);

  return (
    <Modal open={open} title="New meeting" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;
          if (!userId) {
            setLoading(false);
            return setError("Not authenticated.");
          }
          try {
            await createMeeting({ organization_id: orgId, title, notes, created_by: userId });
            setLoading(false);
            await onCreated();
          } catch (err: any) {
            setLoading(false);
            setError(err.message ?? "Failed to create meeting.");
          }
        }}
      >
        <label className="block text-xs text-[rgb(var(--muted))]">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly sync, customer call..." />
        </label>
        <label className="block text-xs text-[rgb(var(--muted))]">
          Notes
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Paste notes or transcript. Voice-to-text can write into this field later."
          />
        </label>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create meeting"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

