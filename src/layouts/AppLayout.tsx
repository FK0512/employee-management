import { Outlet } from "react-router-dom";
import SidebarNav from "../components/navigation/SidebarNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[240px_1fr] md:gap-6 md:px-6 md:py-6">
        <SidebarNav />

        <main className="rounded-2xl border border-white/10 bg-[rgb(var(--panel))]/40 p-4 backdrop-blur md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
