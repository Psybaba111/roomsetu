import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { Badge, Empty } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listConversations } from "@/lib/roomsetu/account-api";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listConversations>>>([]);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      void listConversations().then(setRows).catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, [user]);

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Messages</h1>
      <p className="mt-1 text-sm text-muted">Threads refresh every few seconds. Phone numbers stay off the conversation.</p>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-6 text-sm"><Link to="/login" className="text-primary">Sign in</Link> to see messages.</p> : null}
      <div className="mt-6 grid gap-2">
        {rows.map((row) => (
          <Link key={String(row.id)} to="/messages/$id" params={{ id: String(row.id) }} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{String(row.otherName || "Host")}</p>
              {Number(row.unread) > 0 ? <Badge tone="good">{String(row.unread)} new</Badge> : null}
            </div>
            <p className="text-sm text-muted">{String(row.listingTitle || "Listing")}</p>
            <p className="mt-2 line-clamp-2 text-sm">{String(row.lastBody || "No messages yet")}</p>
            {row.otherDemo ? <p className="mt-2 text-xs text-warn">Sample host</p> : null}
          </Link>
        ))}
      </div>
      {user && rows.length === 0 ? <div className="mt-6"><Empty title="No conversations yet" body="Open a listing and message the host." /></div> : null}
    </AppShell>
  );
}
