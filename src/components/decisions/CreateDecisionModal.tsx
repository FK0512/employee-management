import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";
import { createDecision } from "../../services/decisions";

export default function CreateDecisionModal({
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
  const [why, setWhy] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setWhy("");
    setDescription("");
    setTags("");
    setError(null);
    setLoading(false);
  }, [open]);

  return (
    <Modal open={open} title="New decision" onClose={onClose}>
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
            await createDecision({
              organization_id: orgId,
              title,
              why,
              description,
              created_by: userId,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            });
            setLoading(false);
            await onCreated();
          } catch (err: any) {
            setLoading(false);
            setError(err.message ?? "Failed to create decision.");
          }
        }}
      >
        <label className="block text-xs text-[rgb(var(--muted))]">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did we decide?" />
        </label>
        <label className="block text-xs text-[rgb(var(--muted))]">
          Why
          <Textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={4}
            placeholder="The context + reasoning behind the decision..."
          />
        </label>
        <label className="block text-xs text-[rgb(var(--muted))]">
          Description (optional)
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Extra details." />
        </label>
        <label className="block text-xs text-[rgb(var(--muted))]">
          Tags (comma separated)
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. product, pricing, onboarding" />
        </label>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create decision"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

