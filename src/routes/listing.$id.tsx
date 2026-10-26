import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { AreaMap } from "@/components/area-map";
import { Badge, Button, Panel, TextArea } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatDate, inr, labelOf, PROPERTY_TYPES, ROOM_TYPES, FURNISHED, REPORT_CATEGORIES } from "@/lib/roomsetu/catalog";
import { applyToListing, blockUser, fileReport, matchForListing, savedIds, startConversation, toggleSaved } from "@/lib/roomsetu/account-api";
import { getListing, recordView } from "@/lib/roomsetu/public-api";

export const Route = createFileRoute("/listing/$id")({
  loader: ({ params }) => getListing({ data: params.id }),
  component: ListingPage,
});

function ListingPage() {
  const listing = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("Is this room still available? I can share a bit about my work and move-in date.");
  const [applyNote, setApplyNote] = useState("");
  const [match, setMatch] = useState<Awaited<ReturnType<typeof matchForListing>> | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [category, setCategory] = useState("wrong");

  useEffect(() => {
    if (!listing) return;
    void recordView({ data: listing.id }).catch(() => undefined);
  }, [listing]);

  useEffect(() => {
    if (!listing || !user) return;
    void savedIds()
      .then((ids) => setSaved(ids.includes(listing.id)))
      .catch(() => undefined);
    void matchForListing({ data: listing.id })
      .then(setMatch)
      .catch(() => undefined);
  }, [listing, user]);

  if (!listing) {
    return (
      <AppShell>
        <p>This listing is not available.</p>
      </AppShell>
    );
  }

  const photos = listing.photos.length ? listing.photos : [{ url: listing.coverImage, category: "Bedroom" }];

  async function act(work: () => Promise<unknown>, ok: string) {
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    try {
      await work();
      toast.success(ok);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finish that.");
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <img src={photos[photo]?.url} alt="" className="h-72 w-full rounded-xl object-cover md:h-96" />
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {photos.map((item, index) => (
              <button key={item.url + index} type="button" onClick={() => setPhoto(index)} className="shrink-0">
                <img src={item.url} alt={item.category} className={`h-16 w-24 rounded-md object-cover ${index === photo ? "ring-2 ring-primary" : ""}`} />
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.verificationStatus === "verified" ? <Badge tone="good">Verified</Badge> : <Badge>Not verified yet</Badge>}
            {listing.isDemo ? <Badge tone="warn">Demo listing</Badge> : null}
            <Badge>{labelOf(PROPERTY_TYPES, listing.propertyType)}</Badge>
            <Badge>{labelOf(ROOM_TYPES, listing.roomType)}</Badge>
            <Badge>{labelOf(FURNISHED, listing.furnished)}</Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl">{listing.title}</h1>
          <p className="mt-1 text-muted">
            {listing.localityName}, {listing.cityName}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed">{listing.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            {[
              ["Rent", inr(listing.monthlyRent)],
              ["Deposit", inr(listing.deposit)],
              ["Available", formatDate(listing.availableFrom)],
              ["Minimum stay", `${listing.minStay} months`],
              ["Occupants now", String(listing.occupants)],
              ["Gender", listing.genderPref],
              ["Looking for", listing.occupantPref],
              ["Guests", listing.guestPolicy],
              ["Food", listing.foodAvailable ? "Available" : "Not included"],
              ["Smoking", listing.smokingAllowed ? "Allowed" : "Not allowed"],
              ["Pets", listing.petsAllowed ? "Allowed" : "Not allowed"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-surface p-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-8 text-lg font-medium">In the home</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {listing.amenities.map((item) => (
              <li key={item.id}>
                <Badge>{item.label}</Badge>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-lg font-medium">House rules</h2>
          <p className="mt-2 text-sm text-muted">{listing.houseRules}</p>
          {listing.roommatePref ? <p className="mt-2 text-sm">Roommate note: {listing.roommatePref}</p> : null}
          <Panel className="mt-6">
            <h2 className="font-medium">Where</h2>
            <p className="mt-1 text-sm text-muted">
              {listing.localityName}, {listing.cityName}. The street address stays hidden. The map shows the neighbourhood, not the door.
            </p>
            {listing.lat != null && listing.lng != null ? (
              <>
                <div className="mt-3">
                  <AreaMap
                    mode="area"
                    points={[{ lat: listing.lat, lng: listing.lng, label: `${listing.localityName}, ${listing.cityName}` }]}
                  />
                </div>
                <p className="mt-2 text-xs text-faint">This stays inside RoomSetu. The street address is not shared.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">This listing has no area pin yet.</p>
            )}
          </Panel>
        </div>
        <aside className="space-y-4">
          <Panel>
            <p className="text-sm text-muted">Monthly rent</p>
            <p className="font-display text-4xl tabular-nums">{inr(listing.monthlyRent)}</p>
            <p className="text-sm text-muted">Deposit {inr(listing.deposit)}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  void act(async () => {
                    const result = await toggleSaved({ data: listing.id });
                    setSaved(result.saved);
                  }, saved ? "Removed" : "Saved")
                }
              >
                {saved ? "Saved" : "Save listing"}
              </Button>
            </div>
          </Panel>
          {isPending ? <div className="h-24 animate-pulse rounded-xl bg-line" /> : null}
          {!isPending && !user ? (
            <Panel>
              <p className="text-sm">Sign in to message the host or apply. Phone numbers are not shown.</p>
              <Link to="/login" className="mt-3 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
                Sign in
              </Link>
            </Panel>
          ) : null}
          {user ? (
            <>
              {match ? (
                <Panel>
                  <p className="text-sm text-muted">Match with your profile</p>
                  <p className="font-display text-4xl tabular-nums">{match.score}%</p>
                  <p className="mt-1 text-sm">{match.note}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {match.reasons.map((reason) => (
                      <li key={reason.label} className="flex justify-between gap-3">
                        <span>{reason.label}</span>
                        <span className="text-muted">{reason.tone}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
              <Panel>
                <h2 className="font-medium">{listing.hostName}</h2>
                <p className="text-sm text-muted">
                  {listing.hostOccupation}
                  {listing.hostAge ? ` · ${listing.hostAge}` : ""}
                </p>
                <p className="mt-2 text-sm">{listing.hostAbout}</p>
                {listing.hostVerification === "verified" ? <div className="mt-2"><Badge tone="good">Verified host</Badge></div> : null}
                {listing.isDemo ? (
                  <p className="mt-3 text-xs text-warn">Sample host. Your message is saved, but nobody is waiting on the other side.</p>
                ) : null}
                <TextArea className="mt-3" value={message} onChange={(event) => setMessage(event.target.value)} />
                <Button
                  className="mt-3 w-full"
                  type="button"
                  onClick={() =>
                    void act(async () => {
                      const result = await startConversation({ data: { listingId: listing.id, body: message } });
                      await navigate({ to: "/messages/$id", params: { id: result.id } });
                    }, "Message sent")
                  }
                >
                  Message host
                </Button>
                <TextArea className="mt-3" value={applyNote} placeholder="Short note with your application" onChange={(event) => setApplyNote(event.target.value)} />
                <Button
                  className="mt-3 w-full"
                  variant="ghost"
                  type="button"
                  onClick={() => void act(() => applyToListing({ data: { listingId: listing.id, message: applyNote || message } }), "Application sent")}
                >
                  Apply for this room
                </Button>
                <div className="mt-3 flex gap-2">
                  <Button variant="quiet" type="button" onClick={() => void act(() => blockUser({ data: listing.ownerId }), "Host blocked")}>
                    Block
                  </Button>
                  <Button variant="quiet" type="button" onClick={() => setReportOpen((open) => !open)}>
                    Report
                  </Button>
                </div>
                {reportOpen ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void act(() => fileReport({ data: { targetType: "listing", targetId: listing.id, category, details: "Reported from the listing page." } }), "Report filed");
                    }}
                  >
                    <select className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                      {REPORT_CATEGORIES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="danger" className="w-full">
                      Submit report
                    </Button>
                  </form>
                ) : null}
              </Panel>
            </>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
