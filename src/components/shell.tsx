import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Home, MessageCircle, Search, UserRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile } from "@/lib/roomsetu/account-api";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 text-primary-fg" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M8 22V13c0-2.6 2.4-4 8-4s8 1.4 8 4v9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12.5 22v-5.5h7V22" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!user?.id) return;
    void ensureProfile({
      data: { fullName: user.displayName ?? "", email: user.primaryEmail ?? "" },
    }).catch(() => undefined);
  }, [user?.id, user?.displayName, user?.primaryEmail]);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Mark />
            <span className="font-display text-xl leading-none">
              Room<span className="italic">Setu</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            <Link to="/search" className="text-muted hover:text-ink">
              Find a room
            </Link>
            <Link to="/room-wanted" className="text-muted hover:text-ink">
              Room wanted
            </Link>
            <Link to="/create-listing" className="text-muted hover:text-ink">
              List a room
            </Link>
            <Link to="/dashboard" className="text-muted hover:text-ink">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isPending ? <span className="h-8 w-20 animate-pulse rounded-md bg-line" /> : null}
            {!isPending && user ? <UserButton /> : null}
            {!isPending && !user ? (
              <Link to="/login" className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:pb-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
        <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-xs ${active ? "text-primary" : "text-muted"}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
