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
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const nav = [
  { to: "/coach", label: "Advice", icon: MessageCircle },
  { to: "/help-me-reply", label: "Help Me Reply", icon: MessageSquareText },
  { to: "/conversation-starter", label: "Pickup Lines", icon: Feather },
  { to: "/screenshots", label: "Text Analyzer", icon: ImageIcon },
  { to: "/profile-review", label: "Review A Dating Profile", icon: UserCheck },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/conversations", label: "History", icon: MessageSquareText },
  { to: "/account", label: "Account", icon: Settings },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="min-h-screen gradient-app text-foreground">
      {/* Hamburger button — inside the white card on mobile, not above the purple gradient */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`fixed left-4 z-50 grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/90 text-foreground shadow-soft backdrop-blur md:hidden ${
          path === "/home" ? "top-16" : "top-3"
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Slide-over menu (all sizes) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-border bg-card shadow-lift">
            <div className="flex items-center justify-between px-4 py-4">
              <Link to="/home" className="flex min-w-0 items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkle className="h-5 w-5" />
                </span>
                <span className="truncate font-serif text-xl">Cyrano</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
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
              <p className="mt-2 flex flex-wrap gap-2">
                <Link to="/terms" className="hover:text-foreground">Terms</Link>
                <span>·</span>
                <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
                <span>·</span>
                <Link to="/support" className="hover:text-foreground">Support</Link>
              </p>
            </div>
          </div>
        </div>
      )}

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
          <p className="mt-2 flex flex-wrap gap-2">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <span>·</span>
            <Link to="/support" className="hover:text-foreground">Support</Link>
          </p>
        </div>
      </aside>

      <main className="pb-24 md:ml-60 md:pb-6">
        <div className="mx-auto max-w-3xl px-4 pt-16 md:px-8 md:pt-10">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {[
            { to: "/home", label: "Home", icon: Sparkle },
            { to: "/coach", label: "Advice", icon: MessageCircle },
            { to: "/help-me-reply", label: "Text\nResponse", icon: MessageSquareText },
            { to: "/connections", label: "People", icon: Users },
            { to: "/account", label: "Me", icon: Settings },
          ].map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={`flex flex-col items-center gap-1 px-1 py-2 text-center text-[11px] leading-tight whitespace-pre-line transition-colors ${
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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
