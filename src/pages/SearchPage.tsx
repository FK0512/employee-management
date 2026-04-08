import { useEffect, useState } from "react";
import { useSessionStore } from "../context/sessionStore";
import { searchMemory } from "../services/search";
import MemorySearchForm from "../components/search/MemorySearchForm";
import SearchResults from "../components/search/SearchResults";

export default function SearchPage() {
  const orgId = useSessionStore((s) => s.activeOrganizationId)!;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    setRows([]);
  }, [orgId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Search</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Ask: “Why did we do X?” or “What happened in client Y call?”</p>
        </div>
      </div>

      <MemorySearchForm
        query={query}
        setQuery={setQuery}
        loading={loading}
        error={error}
        onSearch={async () => {
          setError(null);
          setLoading(true);
          try {
            const data = await searchMemory(orgId, query);
            setRows(data);
          } catch (e: any) {
            setError(e.message ?? "Search failed.");
          } finally {
            setLoading(false);
          }
        }}
      />

      <SearchResults rows={rows} />
    </div>
  );
}
