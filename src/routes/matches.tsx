import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { Badge, Empty } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { myMatches } from "@/lib/roomsetu/account-api";
import { inr } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof myMatches>> | null>(null);
  useEffect(() => {
    if (!user) return;
    void myMatches().then(setData).catch(() => undefined);
  }, [user]);
  return (
    <AppShell>
      <h1 className="font-display text-4xl">Matches</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">A rules score from your city, budget, move-in, room type, and lifestyle. Not a machine-learning ranker.</p>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-4"><Link to="/login" className="text-primary">Sign in</Link> and add a room-wanted post for a sharper score.</p> : null}
      <div className="mt-6 grid gap-3">
        {data?.items.map((item) => (
          <Link key={item.id} to="/listing/$id" params={{ id: item.id }} className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[7rem_1fr]">
            <img src={item.coverImage} alt="" className="h-24 w-full rounded-md object-cover sm:w-28" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-3xl tabular-nums text-primary">{item.score}%</span>
                {item.isDemo ? <Badge tone="warn">Demo</Badge> : null}
              </div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted">{item.localityName}, {item.cityName} · {inr(item.monthlyRent)}</p>
              <p className="mt-2 text-sm">{item.note}</p>
              <p className="mt-2 text-xs text-muted">{item.reasons.map((reason) => `${reason.label}: ${reason.tone}`).join(" · ")}</p>
            </div>
          </Link>
        ))}
      </div>
      {data && data.items.length === 0 ? <div className="mt-6"><Empty title="No matches yet" body="Complete your profile or post a room-wanted request." /></div> : null}
    </AppShell>
  );
}
