import { NavLink, useNavigate } from "react-router-dom";
import { Search, StickyNote, Users, Video } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "../ui/Button";
import { useSessionStore } from "../../context/sessionStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: Users, end: true },
  { to: "/decisions", label: "Decisions", icon: StickyNote },
  { to: "/meetings", label: "Meetings", icon: Video },
  { to: "/search", label: "Search", icon: Search }
];

export default function SidebarNav() {
  const signOut = useSessionStore((s) => s.signOut);
  const activeOrganizationId = useSessionStore((s) => s.activeOrganizationId);
  const navigate = useNavigate();

  return (
    <aside className="rounded-2xl border border-white/10 bg-[rgb(var(--panel))]/60 p-3 backdrop-blur">
      <div className="flex items-center justify-between px-2 py-2">
        <div>
          <div className="text-xs tracking-widest text-[rgb(var(--muted))]">WORKSPACE</div>
          <div className="text-sm font-semibold">Digital Memory</div>
        </div>
        <div className="text-xs text-[rgb(var(--muted))]">{activeOrganizationId ? "Org set" : "No org"}</div>
      </div>

      <nav className="mt-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  isActive ? "bg-white/10 text-white" : "text-[rgb(var(--muted))] hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="w-full justify-center"
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}

