import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui";
import { inr, labelOf, ROOM_TYPES } from "@/lib/roomsetu/catalog";
import type { ListingCard as Card } from "@/lib/roomsetu/public-api";

export function ListingCard({ listing }: { listing: Card }) {
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group overflow-hidden rounded-xl border border-line bg-surface"
    >
      <img src={listing.coverImage} alt="" className="h-44 w-full object-cover" />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-2">
          {listing.verificationStatus === "verified" ? <Badge tone="good">Verified</Badge> : null}
          {listing.isDemo ? <Badge tone="warn">Demo</Badge> : null}
          {listing.featured ? <Badge>Featured</Badge> : null}
          {listing.listingKind === "entire" ? <Badge>Entire flat · Owner</Badge> : null}
        </div>
        <h3 className="font-medium leading-snug group-hover:text-primary">{listing.title}</h3>
        <p className="text-sm text-muted">
          {listing.localityName}, {listing.cityName}
        </p>
        <p className="flex items-baseline justify-between gap-3">
          <span className="font-display text-2xl tabular-nums">{inr(listing.monthlyRent)}</span>
          <span className="text-xs text-muted">{labelOf(ROOM_TYPES, listing.roomType)}</span>
        </p>
        <p className="text-xs text-faint">Deposit {inr(listing.deposit)}</p>
      </div>
    </Link>
  );
}
