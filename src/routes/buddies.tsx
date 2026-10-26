import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { Badge, Panel } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { buddyForListing, myBuddyBoard, type BuddyView } from "@/lib/roomsetu/buddy-api";
import { inr } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/buddies")({
  loader: () => buddyForListing({ data: "demo:lst:20" }),
  component: BuddiesPage,
});

function GroupCard({ view }: { view: BuddyView }) {
  return (
    <Link to="/listing/$id" params={{ id: view.listingId }} className="block rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">{view.title}</h2>
        <Badge>{view.seats} people</Badge>
        {view.club?.status === "proposed" ? <Badge>With the owner</Badge> : null}
        {view.club?.status === "accepted" ? <Badge tone="good">Accepted</Badge> : null}
        {view.club?.isDemo ? <Badge tone="warn">Demo</Badge> : null}
      </div>
      <p className="mt-1 text-sm text-muted">{view.localityName}, {view.cityName} · rent {inr(view.monthlyRent)} · about {inr(view.share)} each</p>
      <p className="mt-2 text-sm">{view.summary}</p>
      <p className="mt-2 text-sm">{view.people.map((person) => person.name).join(", ") || "No matches yet"}</p>
    </Link>
  );
}

function BuddiesPage() {
  const example = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [board, setBoard] = useState<Awaited<ReturnType<typeof myBuddyBoard>> | null>(null);

  useEffect(() => {
    if (!user) return;
    void myBuddyBoard().then(setBoard).catch(() => undefined);
  }, [user]);

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Buddy up</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Team up with other people already looking in the same locality, then take one proposal to the owner of a whole flat.
        A 3 BHK needs three people. Each of you keeps your own request. The owner sees the group, not your phone number.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Say where", "Post a room request and name the locality."],
          ["2", "Find your people", "RoomSetu lines up others searching that same place whose budgets can share the rent."],
          ["3", "Go to the owner", "When every seat is confirmed, send the group as one proposal."],
        ].map(([step, title, body]) => (
          <li key={step} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-display text-2xl text-primary">{step}</p>
            <h2 className="mt-1 font-medium">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ol>
      {example?.needed ? (
        <section className="mt-8">
          <h2 className="font-display text-3xl">A 3 BHK with a ready group</h2>
          <p className="mt-1 text-sm text-muted">Dadar, Mumbai. Three demo searches, one proposal. Open it to see how an owner would read the group.</p>
          <div className="mt-3">
            <GroupCard view={example} />
          </div>
        </section>
      ) : null}
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? (
        <Panel className="mt-6">
          <p className="text-sm">Sign in and post where you want to live. Buddy up stays free. Messaging stays inside RoomSetu.</p>
          <Link to="/login" className="mt-3 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">Sign in</Link>
        </Panel>
      ) : null}
      {board ? (
        <>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Your groups</h2>
            <div className="mt-3 grid gap-3">
              {board.groups.map((view) => <GroupCard key={view.listingId} view={view} />)}
              {board.groups.length === 0 ? <p className="text-sm text-muted">You have not joined a group yet.</p> : null}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Whole flats you could share</h2>
            {!board.hasWanted ? (
              <p className="mt-2 text-sm">
                <Link to="/create-room-wanted" className="text-primary">Post a room request</Link> and name the locality. That is how you are matched with the other seats.
              </p>
            ) : null}
            <div className="mt-3 grid gap-3">
              {board.suggestions.map((view) => <GroupCard key={view.listingId} view={view} />)}
              {board.hasWanted && board.suggestions.length === 0 ? (
                <p className="text-sm text-muted">No whole flat in your localities needs a group right now.</p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
