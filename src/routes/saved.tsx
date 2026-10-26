import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { Badge, Empty } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { savedListings } from "@/lib/roomsetu/account-api";
import { inr, labelOf, ROOM_TYPES } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
});

function SavedPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof savedListings>>>([]);
  useEffect(() => {
    if (!user) return;
    void savedListings().then(setRows).catch(() => undefined);
  }, [user]);
  return (
    <AppShell>
      <h1 className="font-display text-4xl">Saved rooms</h1>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-6 text-sm"><Link to="/login" className="text-primary">Sign in</Link> to keep a list.</p> : null}
      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <Link key={String(row.id)} to="/listing/$id" params={{ id: String(row.id) }} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
            <img src={String(row.coverImage)} alt="" className="h-20 w-28 rounded-md object-cover" />
            <div>
              <div className="flex gap-2">{row.isDemo ? <Badge tone="warn">Demo</Badge> : null}</div>
              <p className="font-medium">{String(row.title)}</p>
              <p className="text-sm text-muted">{String(row.localityName)}, {String(row.cityName)} · {labelOf(ROOM_TYPES, String(row.roomType))}</p>
              <p className="tabular-nums">{inr(Number(row.monthlyRent))}</p>
            </div>
          </Link>
        ))}
      </div>
      {user && rows.length === 0 ? <div className="mt-6"><Empty title="Nothing saved" body="Tap save on a listing you might message." /></div> : null}
    </AppShell>
  );
}
