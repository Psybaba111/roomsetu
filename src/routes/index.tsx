import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { LockKeyhole, MapPinned, MessagesSquare, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shell";
import { ListingCard } from "@/components/listing-card";
import { Button, SelectInput, TextInput } from "@/components/ui";
import { listCities, searchListings, type SearchInput } from "@/lib/roomsetu/public-api";

const blank: SearchInput = {
  city: "",
  locality: "",
  maxRent: null,
  roomType: "",
  furnished: "",
  gender: "",
  food: "",
  amenities: "",
  sort: "recommended",
  lat: null,
  lng: null,
  q: "",
  listingKind: "",
};

export const Route = createFileRoute("/")({
  loader: async () => {
    const [places, listings] = await Promise.all([
      listCities(),
      searchListings({ data: blank }),
    ]);
    return { cities: places.cities, listings: listings.slice(0, 6) };
  },
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const [city, setCity] = useState("bengaluru");
  const [budget, setBudget] = useState("20000");
  const [moveIn, setMoveIn] = useState("");
  const [intent, setIntent] = useState("looking");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (intent === "offering" || intent === "offering-flat") {
      void navigate({ to: "/create-listing", search: { kind: intent === "offering-flat" ? "entire" : "room" } });
      return;
    }
    void navigate({
      to: "/search",
      search: {
        city,
        maxRent: budget,
        moveIn,
        listingKind: intent === "looking-flat" ? "entire" : undefined,
      },
    });
  }

  return (
    <AppShell>
      <section className="grid items-end gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium text-primary">Spare rooms across Indian cities</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">
            Find a room. Find a flatmate. Find your place.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            RoomSetu is for spare rooms and for owners renting out the whole flat. No sale ads, no brokers, no travel packages. Phone numbers stay off the listing.
          </p>
        </div>
        <img
          src="/rooms/bedroom.jpg"
          alt="A sunlit private bedroom with a wooden bed and linen"
          className="h-64 w-full rounded-xl object-cover md:h-80"
        />
      </section>

      <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="block md:col-span-1">
            <span className="mb-1 block text-sm font-medium">Where</span>
            <SelectInput value={city} onChange={(event) => setCity(event.target.value)}>
              {data.cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">I am</span>
            <SelectInput value={intent} onChange={(event) => setIntent(event.target.value)}>
              <option value="looking">Looking for a room</option>
              <option value="looking-flat">Looking for an entire flat</option>
              <option value="offering">Offering a spare room</option>
              <option value="offering-flat">I own a flat to rent</option>
            </SelectInput>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Budget / month</span>
            <TextInput inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Move-in</span>
            <TextInput type="date" value={moveIn} onChange={(event) => setMoveIn(event.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="sm:min-w-40">
            {intent === "offering" ? "List your room" : intent === "offering-flat" ? "List your flat" : intent === "looking-flat" ? "Find flats" : "Find rooms"}
          </Button>
          <Link to="/create-room-wanted" className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium">
            I need a room
          </Link>
        </div>
      </form>

      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [ShieldCheck, "Verified listings", "A badge only after a review"],
          [MessagesSquare, "Private messaging", "Phone numbers stay hidden"],
          [MapPinned, "Neighbourhood map", "Area only — not the door"],
          [LockKeyhole, "Your details", "You choose what a profile shows"],
        ].map(([Icon, title, body]) => (
          <li key={String(title)} className="rounded-lg border border-line bg-surface p-3">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-medium">{title as string}</p>
            <p className="mt-1 text-xs text-muted">{body as string}</p>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Rooms open now</h2>
            <p className="text-sm text-muted">Sample listings are marked Demo so you can browse before anyone signs in.</p>
          </div>
          <Link to="/search" className="text-sm font-medium text-primary">
            All rooms
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          ["01", "Say which city", "Search by locality, rent, room type, and when you can move."],
          ["02", "Read the fit", "A plain compatibility score explains budget, dates, and lifestyle."],
          ["03", "Message inside RoomSetu", "Enquire, apply, or publish that you need a room."],
        ].map(([step, title, body]) => (
          <article key={step} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-display text-2xl text-primary">{step}</p>
            <h3 className="mt-2 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-line bg-primary p-5 text-primary-fg">
          <h2 className="font-display text-3xl">Have an unused room?</h2>
          <p className="mt-2 text-sm text-primary-fg/80">List a spare room free. Your phone number stays private.</p>
          <Link to="/create-listing" search={{ kind: "room" }} className="mt-4 inline-flex h-11 items-center rounded-md bg-surface px-4 text-sm font-medium text-ink">
            List your room
          </Link>
        </article>
        <article className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-display text-3xl">Own a flat?</h2>
          <p className="mt-2 text-sm text-muted">List the whole home for rent. For a 3 BHK, people already searching that locality can buddy up and come to you as one group.</p>
          <Link to="/create-listing" search={{ kind: "entire" }} className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
            List the whole flat
          </Link>
        </article>
        <article className="overflow-hidden rounded-xl border border-line bg-surface">
          <img src="/rooms/living.jpg" alt="Shared living room with a sofa and plants" className="h-36 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-3xl">Need a room?</h2>
            <p className="mt-2 text-sm text-muted">Publish what you can pay and when you can move. Hosts can find you too.</p>
            <Link to="/create-room-wanted" className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
              Post room wanted
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Cities</h2>
        <p className="mt-1 text-sm text-muted">Not a fixed list. Admins can add cities and localities.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.cities.map((city) => (
            <Link
              key={city.id}
              to="/search"
              search={{ city: city.id }}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
