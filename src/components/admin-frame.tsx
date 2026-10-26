import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";

const links = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/listings", "Listings"],
  ["/admin/verifications", "Verification"],
  ["/admin/reports", "Reports"],
  ["/admin/analytics", "Analytics"],
] as const;

export function AdminFrame({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <AppShell>
      <p className="text-sm text-primary">Admin</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {links.map(([href, label]) => (
          <Link
            key={href}
            to={href}
            className={`shrink-0 rounded-md px-3 py-2 text-sm ${path === href ? "bg-primary text-primary-fg" : "border border-line bg-surface"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </AppShell>
  );
}
