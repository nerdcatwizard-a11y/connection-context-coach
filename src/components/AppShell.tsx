import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  MessageCircle,
  Users,
  Image as ImageIcon,
  UserCheck,
  MessageSquareText,
  BookOpen,
  Settings,
  Sparkle,
  Feather,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/help-me-reply", label: "Help Me Reply", icon: MessageSquareText },
  { to: "/conversation-starter", label: "Start a Convo", icon: Feather },
  { to: "/screenshots", label: "Read a Convo", icon: ImageIcon },
  { to: "/profile-review", label: "Review a Profile", icon: UserCheck },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/conversations", label: "History", icon: MessageSquareText },
  { to: "/account", label: "Account", icon: Settings },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen gradient-app text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur md:flex">
        <Link to="/home" className="flex items-center gap-2 px-6 py-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkle className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl">Cyrano</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          <SideItem to="/home" label="Home" active={path === "/home"} icon={Sparkle} />
          {nav.map((n) => (
            <SideItem
              key={n.to}
              to={n.to}
              label={n.label}
              active={path.startsWith(n.to)}
              icon={n.icon}
            />
          ))}
        </nav>
        <div className="p-4 text-xs text-muted-foreground">
          <p>Private. Yours only.</p>
        </div>
      </aside>

      <main className="pb-24 md:ml-60 md:pb-6">
        <div className="mx-auto max-w-3xl px-4 pt-6 md:px-8 md:pt-10">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {[
            { to: "/home", label: "Home", icon: Sparkle },
            { to: "/coach", label: "Coach", icon: MessageCircle },
            { to: "/connections", label: "People", icon: Users },
            { to: "/journal", label: "Journal", icon: BookOpen },
            { to: "/account", label: "Me", icon: Settings },
          ].map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SideItem({
  to,
  label,
  active,
  icon: Icon,
}: {
  to: string;
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
