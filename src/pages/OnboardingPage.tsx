import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useSessionStore } from "../context/sessionStore";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const refreshActiveOrg = useSessionStore((s) => s.refreshActiveOrg);
  const activeOrganizationId = useSessionStore((s) => s.activeOrganizationId);

  const [orgName, setOrgName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeOrganizationId) navigate("/");
  }, [activeOrganizationId, navigate]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Choose your workspace</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Create a new organization or join with a code from an admin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          title="Create an organization"
          subtitle="Best for founders or the first person setting up the workspace."
          actions={
            <Button
              disabled={loading || orgName.trim().length < 2}
              onClick={async () => {
                setError(null);
                setLoading(true);
                const { data, error: rpcError } = await supabase.rpc("create_organization", { org_name: orgName });
                setLoading(false);
                if (rpcError) return setError(rpcError.message);
                if (!data) return setError("Failed to create organization.");
                await refreshActiveOrg();
                navigate("/");
              }}
            >
              Create
            </Button>
          }
        >
          <label className="block text-xs text-[rgb(var(--muted))]">
            Organization name
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Inc." />
          </label>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            You’ll become an admin and get a join code to share with your team.
          </p>
        </Card>

        <Card
          title="Join an organization"
          subtitle="Enter the join code shared by your admin."
          actions={
            <Button
              disabled={loading || joinCode.trim().length < 6}
              variant="ghost"
              onClick={async () => {
                setError(null);
                setLoading(true);
                const { error: rpcError } = await supabase.rpc("join_organization_by_code", { p_join_code: joinCode });
                setLoading(false);
                if (rpcError) return setError(rpcError.message);
                await refreshActiveOrg();
                navigate("/");
              }}
            >
              Join
            </Button>
          }
        >
          <label className="block text-xs text-[rgb(var(--muted))]">
            Join code
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. 1a2b3c4d5e" />
          </label>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Join codes are generated when an organization is created.
          </p>
        </Card>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}
    </div>
  );
}

