import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function MemorySearchForm({
  query,
  setQuery,
  loading,
  error,
  onSearch
}: {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSearch: () => Promise<void>;
}) {
  return (
    <Card
      title="Memory search"
      subtitle="Full-text search (Postgres) across decisions, meetings, and notes."
      actions={
        <Button disabled={loading || query.trim().length === 0} onClick={onSearch}>
          {loading ? "Searching..." : "Search"}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. pricing decision, onboarding, SOC2..." />
      </div>
      {error ? <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}
    </Card>
  );
}

