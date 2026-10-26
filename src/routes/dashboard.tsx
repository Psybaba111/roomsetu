import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Badge, Button, Empty, Panel } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { myListings, myMatches, myOverview, setListingStatus } from "@/lib/roomsetu/account-api";
import { ownerBuddyInbox } from "@/lib/roomsetu/buddy-api";
import { inr } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof myOverview>> | null>(null);
  const [listings, setListings] = useState<Awaited<ReturnType<typeof myListings>>>([]);
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof myMatches>> | null>(null);
  const [inbox, setInbox] = useState<Awaited<ReturnType<typeof ownerBuddyInbox>>>([]);

  function load() {
    void myOverview().then(setOverview).catch(() => undefined);
    void myListings().then(setListings).catch(() => undefined);
    void myMatches().then(setMatches).catch(() => undefined);
    void ownerBuddyInbox().then(setInbox).catch(() => undefined);
  }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Your rooms, your search, and the next thing to do.</p>
        </div>
        {overview?.profile?.role === "admin" || overview?.profile?.role === "super_admin" ? (
          <Link to="/admin" className="text-sm font-medium text-primary">Admin</Link>
        ) : null}
      </div>
      {isPending ? <div className="mt-6 h-28 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-6 text-sm"><Link to="/login" className="text-primary">Sign in</Link> to see your dashboard.</p> : null}
      {overview ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Profile", `${overview.completion}%`],
              ["Active listings", String(overview.activeListings)],
              ["Listed rent", inr(overview.listedRent)],
              ["Unread messages", String(overview.unread)],
            ].map(([label, value]) => (
              <Panel key={label}>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
              </Panel>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">Listed rent is what you are asking. RoomSetu does not collect it. Boosts are a separate Razorpay charge.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/create-listing" search={{ kind: "room" }} className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">Create listing</Link>
            <Link to="/create-listing" search={{ kind: "entire" }} className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">List a whole flat</Link>
            <Link to="/create-room-wanted" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Room wanted</Link>
            <Link to="/matches" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Matches</Link>
            <Link to="/buddies" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Buddy up</Link>
            <Link to="/applications" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Applications</Link>
            <Link to="/billing" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Billing</Link>
          </div>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Groups for your flats</h2>
            <div className="mt-3 grid gap-3">
              {inbox.map((item) => (
                <Link key={item.id} to="/listing/$id" params={{ id: item.listingId }} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.status === "accepted" ? "Accepted" : "Proposal"}</Badge>
                    {item.isDemo ? <Badge tone="warn">Demo</Badge> : null}
                  </div>
                  <p className="mt-1 font-medium">{item.title}</p>
                  <p className="text-sm text-muted">{item.names.join(", ")} · {item.localityName} · {inr(item.monthlyRent)}</p>
                  <p className="mt-1 text-sm">{item.note}</p>
                </Link>
              ))}
              {inbox.length === 0 ? <p className="text-sm text-muted">When a full group proposes on one of your flats, it shows up here.</p> : null}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Your listings</h2>
            <div className="mt-3 grid gap-3">
              {listings.map((listing) => (
                <article key={listing.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[5rem_1fr_auto]">
                  <img src={listing.coverImage} alt="" className="h-16 w-20 rounded-md object-cover" />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{listing.status}</Badge>
                      <Badge tone={listing.verificationStatus === "verified" ? "good" : "neutral"}>{listing.verificationStatus}</Badge>
                    </div>
                    <h3 className="mt-1 font-medium">{listing.title}</h3>
                    <p className="text-sm text-muted">{listing.cityName} · {inr(listing.monthlyRent)} · {listing.views} views · {listing.enquiries} enquiries · quality {listing.qualityScore}</p>
                    {listing.featuredUntil ? <p className="text-xs text-primary">Featured until {listing.featuredUntil.slice(0, 10)}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" type="button" onClick={() => void setListingStatus({ data: { id: listing.id, status: listing.status === "paused" ? "active" : "paused" } }).then(() => { toast.success("Updated"); load(); })}>
                      {listing.status === "paused" ? "Renew" : "Pause"}
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => void setListingStatus({ data: { id: listing.id, status: "occupied" } }).then(load)}>Occupied</Button>
                    <Link
                      to="/billing"
                      search={{ plan: "boost", listing: listing.id }}
                      className="inline-flex h-11 items-center rounded-md px-3 text-sm"
                    >
                      Boost
                    </Link>
                  </div>
                </article>
              ))}
              {listings.length === 0 ? <Empty title="No listings yet" body="List a spare room when you are ready." /> : null}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Recommended for you</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {matches?.items.slice(0, 4).map((item) => (
                <Link key={item.id} to="/listing/$id" params={{ id: item.id }} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-sm text-primary">{item.score}% match</p>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">{item.localityName}, {item.cityName} · {inr(item.monthlyRent)}</p>
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Coming soon</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {["Digital rental agreements", "Rent collection", "Security deposits", "Maintenance requests", "Lease reminders", "Tenant screening"].map((item) => (
                <Panel key={item}>
                  <p className="font-medium">{item}</p>
                  <p className="mt-1 text-xs text-muted">Not built in this prototype. The database has room for payments and subscriptions.</p>
                </Panel>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
