import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { AreaMap } from "@/components/area-map";
import { ListingCard } from "@/components/listing-card";
import { Empty, SelectInput } from "@/components/ui";
import { AMENITIES, FURNISHED, GENDER_PREFS, ROOM_TYPES } from "@/lib/roomsetu/catalog";
import { listCities, searchListings, type SearchInput } from "@/lib/roomsetu/public-api";

type SearchParams = {
  city?: string;
  maxRent?: string;
  roomType?: string;
  furnished?: string;
  gender?: string;
  food?: string;
  sort?: string;
  q?: string;
  amenities?: string;
  moveIn?: string;
  lat?: string;
  lng?: string;
  listingKind?: string;
};

function read(search: Record<string, unknown>): SearchParams {
  const pick = (key: keyof SearchParams) => {
    const value = search[key];
    return typeof value === "string" && value ? value : undefined;
  };
  return {
    city: pick("city"),
    maxRent: pick("maxRent"),
    roomType: pick("roomType"),
    furnished: pick("furnished"),
    gender: pick("gender"),
    food: pick("food"),
    sort: pick("sort"),
    q: pick("q"),
    amenities: pick("amenities"),
    moveIn: pick("moveIn"),
    lat: pick("lat"),
    lng: pick("lng"),
    listingKind: pick("listingKind"),
  };
}

export const Route = createFileRoute("/search")({
  validateSearch: (search): SearchParams => read(search as Record<string, unknown>),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const filters: SearchInput = {
      city: deps.city ?? "",
      locality: "",
      maxRent: deps.maxRent ? Number(deps.maxRent) : null,
      roomType: deps.roomType ?? "",
      furnished: deps.furnished ?? "",
      gender: deps.gender ?? "",
      food: deps.food ?? "",
      amenities: deps.amenities ?? "",
      sort: deps.sort || "recommended",
      lat: deps.lat ? Number(deps.lat) : null,
      lng: deps.lng ? Number(deps.lng) : null,
      q: deps.q ?? "",
      listingKind: deps.listingKind === "entire" || deps.listingKind === "room" ? deps.listingKind : "",
    };
    const [places, listings] = await Promise.all([listCities(), searchListings({ data: filters })]);
    return { places, listings, filters: deps };
  },
  component: SearchPage,
});

function SearchPage() {
  const { places, listings, filters } = Route.useLoaderData();
  const navigate = useNavigate();
  const localities = places.localities.filter((item) => !filters.city || item.cityId === filters.city);

  function update(patch: Partial<SearchParams>) {
    void navigate({ to: "/search", search: { ...filters, ...patch } });
  }

  function useNear() {
    if (!navigator.geolocation) {
      toast.error("This browser cannot share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          sort: "nearest",
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        });
      },
      () => toast.error("Location was blocked. Pick a city instead."),
    );
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">{filters.listingKind === "entire" ? "Entire flats" : "Search"}</h1>
      <p className="mt-1 text-sm text-muted">{listings.length} active listings match these filters.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectInput value={filters.city ?? ""} onChange={(event) => update({ city: event.target.value || undefined })}>
          <option value="">All cities</option>
          {places.cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput value="" onChange={(event) => update({ q: event.target.value ? localities.find((item) => item.id === event.target.value)?.name ?? "" : "" })}>
          <option value="">Any locality</option>
          {localities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.maxRent ?? ""} onChange={(event) => update({ maxRent: event.target.value || undefined })}>
          <option value="">Any budget</option>
          {[8000, 12000, 15000, 20000, 30000, 50000, 80000, 120000].map((rent) => (
            <option key={rent} value={String(rent)}>
              Up to ₹{rent.toLocaleString("en-IN")}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.listingKind ?? ""} onChange={(event) => update({ listingKind: event.target.value || undefined })}>
          <option value="">Rooms and entire flats</option>
          <option value="room">Spare rooms</option>
          <option value="entire">Entire flats, owner listed</option>
        </SelectInput>
        <SelectInput value={filters.roomType ?? ""} onChange={(event) => update({ roomType: event.target.value || undefined })}>
          <option value="">Any room</option>
          {ROOM_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.furnished ?? ""} onChange={(event) => update({ furnished: event.target.value || undefined })}>
          <option value="">Any furnishing</option>
          {FURNISHED.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.gender ?? ""} onChange={(event) => update({ gender: event.target.value || undefined })}>
          <option value="">Any gender preference</option>
          {GENDER_PREFS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.food ?? ""} onChange={(event) => update({ food: event.target.value || undefined })}>
          <option value="">Food optional</option>
          <option value="yes">Food available</option>
        </SelectInput>
        <SelectInput value={filters.amenities ?? ""} onChange={(event) => update({ amenities: event.target.value || undefined })}>
          <option value="">Any amenity</option>
          {AMENITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.sort || "recommended"} onChange={(event) => update({ sort: event.target.value })}>
          <option value="recommended">Recommended</option>
          <option value="rent_asc">Lowest rent</option>
          <option value="rent_desc">Highest rent</option>
          <option value="newest">Recently added</option>
          <option value="soon">Available soon</option>
          <option value="nearest">Nearest</option>
        </SelectInput>
        <button type="button" onClick={useNear} className="h-11 rounded-md border border-line bg-surface px-3 text-sm">
          {filters.lat && filters.lng ? "Location on" : "Use my location"}
        </button>
      </div>
      <div className="mt-4">
        <AreaMap
          onSelect={(point) => {
            if (!point.id) return;
            void navigate({ to: "/listing/$id", params: { id: point.id } });
          }}
          points={listings.flatMap((listing) =>
            listing.lat == null || listing.lng == null
              ? []
              : [{ id: listing.id, lat: listing.lat, lng: listing.lng, label: `${listing.localityName} · ₹${listing.monthlyRent.toLocaleString("en-IN")}` }],
          )}
        />
        <p className="mt-2 text-xs text-faint">Pins are the locality, rounded so the street address stays private.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {listings.length === 0 ? (
        <div className="mt-6">
          <Empty title="No rooms in this filter" body="Widen the city or budget. Demo listings cover most of the launch cities." />
        </div>
      ) : null}
    </AppShell>
  );
}
