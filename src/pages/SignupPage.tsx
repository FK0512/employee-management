import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useSessionStore } from "../context/sessionStore";

export default function SignupPage() {
  const navigate = useNavigate();
  const refreshActiveOrg = useSessionStore((s) => s.refreshActiveOrg);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold">Create account</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Start building a searchable company memory.</p>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
          });
          setLoading(false);
          if (authError) return setError(authError.message);
          await refreshActiveOrg();
          navigate("/onboarding");
        }}
      >
        <label className="block text-xs text-[rgb(var(--muted))]">
          Full name
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </label>

        <label className="block text-xs text-[rgb(var(--muted))]">
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" />
        </label>

        <label className="block text-xs text-[rgb(var(--muted))]">
          Password
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="At least 8 characters"
          />
        </label>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div> : null}

        <Button disabled={loading} type="submit" className="w-full justify-center">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-[rgb(var(--muted))]">
        Already have an account?{" "}
        <Link className="text-white underline decoration-white/30 hover:decoration-white" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}

