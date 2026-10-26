import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Panel } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { answerBuddy, buddyForListing, joinBuddy, proposeBuddy, type BuddyView } from "@/lib/roomsetu/buddy-api";
import { inr } from "@/lib/roomsetu/catalog";

export function BuddyPanel({ listingId }: { listingId: string }) {
  const { user } = useCurrentUserState();
  const [view, setView] = useState<BuddyView | null>(null);

  function load() {
    void buddyForListing({ data: listingId })
      .then(setView)
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, [listingId]);

  if (!view?.needed) return null;

  const mine = user ? view.people.find((person) => person.userId === user.id) : undefined;
  const forming = view.club?.status === "forming";
  const proposed = view.club?.status === "proposed";
  const accepted = view.club?.status === "accepted";

  async function run(work: () => Promise<unknown>, ok: string) {
    try {
      await work();
      toast.success(ok);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the group.");
    }
  }

  return (
    <Panel className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">Buddy up for this {view.seats} BHK</h2>
        {view.club?.isDemo ? <Badge tone="warn">Demo group</Badge> : null}
        {proposed ? <Badge>Proposal with the owner</Badge> : null}
        {accepted ? <Badge tone="good">Owner accepted</Badge> : null}
        {forming ? <Badge>{view.confirmed} of {view.seats} confirmed</Badge> : null}
      </div>
      <p className="mt-2 text-sm text-muted">
        People already searching in {view.localityName} can team up and go to the owner as one group.
        Each person takes about {inr(view.share)}. Phone numbers stay hidden. This is a proposal, not a signed agreement.
      </p>
      <p className="mt-2 text-sm">{view.summary}</p>
      <p className="mt-1 text-sm font-medium tabular-nums">
        Together {inr(view.combinedBudget)} · rent {inr(view.monthlyRent)}
        {view.coversRent ? " · covers the rent" : " · short of the rent"}
      </p>
      <ul className="mt-3 grid gap-2">
        {view.people.map((person) => (
          <li key={person.userId + person.wantedId} className="rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{person.name}{person.age ? `, ${person.age}` : ""}</p>
              {person.isDemo ? <Badge tone="warn">Demo</Badge> : null}
              <Badge>{person.status === "in" ? "In" : person.status === "suggested" ? "Suggested" : "Match"}</Badge>
            </div>
            <p className="text-sm text-muted">{person.occupation || "Looking"} · budget {inr(person.budget)}</p>
            <p className="mt-1 text-xs text-faint">{person.reasons.join(" · ")}</p>
          </li>
        ))}
      </ul>
      {view.people.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No one has named {view.localityName} yet. A room-wanted post in this locality is how you get into the group.</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!user ? (
          <Link to="/login" className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">Sign in to join</Link>
        ) : null}
        {user && !proposed && !accepted && mine?.status !== "in" && mine?.status !== "suggested" ? (
          <Button type="button" onClick={() => void run(() => joinBuddy({ data: listingId }), "You're in this group")}>I'm in</Button>
        ) : null}
        {user && mine?.status === "suggested" ? (
          <Button type="button" onClick={() => void run(() => joinBuddy({ data: listingId }), "You're in this group")}>Confirm my seat</Button>
        ) : null}
        {user && mine?.status === "in" && forming && view.confirmed >= view.seats && view.club ? (
          <Button
            type="button"
            onClick={() => void run(() => proposeBuddy({ data: { clubId: view.club!.id, note: "" } }), "Proposal sent to the owner")}
          >
            Send the group to the owner
          </Button>
        ) : null}
        {user && user.id === view.ownerId && proposed && view.club ? (
          <>
            <Button type="button" onClick={() => void run(() => answerBuddy({ data: { clubId: view.club!.id, status: "accepted" } }), "Group accepted")}>Accept group</Button>
            <Button type="button" variant="ghost" onClick={() => void run(() => answerBuddy({ data: { clubId: view.club!.id, status: "declined" } }), "Passed")}>Pass</Button>
          </>
        ) : null}
        {proposed && !mine ? <p className="text-sm text-muted">This group has already gone to the owner.</p> : null}
        <Link to="/buddies" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">All buddy-ups</Link>
      </div>
    </Panel>
  );
}
