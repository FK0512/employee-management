import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <div className="text-sm tracking-widest text-[rgb(var(--muted))]">DIGITAL MEMORY</div>
          <h1 className="mt-2 text-3xl font-semibold">Company brain, but usable.</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Capture decisions, meetings, and the “why” so knowledge survives team changes.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel))]/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

