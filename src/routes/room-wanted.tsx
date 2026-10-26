import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Badge, Empty, SelectInput } from "@/components/ui";
import { formatDate, inr, labelOf, ROOM_TYPES } from "@/lib/roomsetu/catalog";
import { listCities, listRoomWanted } from "@/lib/roomsetu/public-api";

export const Route = createFileRoute("/room-wanted")({
  validateSearch: (search: Record<string, unknown>): { city?: string } => ({
    city: typeof search.city === "string" && search.city ? search.city : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [places, posts] = await Promise.all([listCities(), listRoomWanted({ data: { city: deps.city ?? "" } })]);
    return { places, posts, city: deps.city ?? "" };
  },
  component: RoomWantedPage,
});

function RoomWantedPage() {
  const { places, posts, city } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">People looking for a room</h1>
          <p className="mt-1 text-sm text-muted">The other side of the marketplace. Name a locality if you want to buddy up for a whole flat. Demo posts are marked.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/buddies" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-medium">
            Buddy up
          </Link>
          <Link to="/create-room-wanted" className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg">
            Post a request
          </Link>
        </div>
      </div>
      <form className="mt-4 max-w-xs" method="get">
        <SelectInput value={city} onChange={(event) => void navigate({ to: "/room-wanted", search: { city: event.target.value } })}>
          <option value="">All cities</option>
          {places.cities.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </SelectInput>
      </form>
      <div className="mt-6 grid gap-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{post.name}, {post.age}</h2>
              {post.isDemo ? <Badge tone="warn">Demo</Badge> : null}
              <Badge>{post.cityName}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{post.occupation} · {labelOf(ROOM_TYPES, post.roomPref)} · {post.localities}</p>
            <p className="mt-3 text-sm">{post.bio}</p>
            <p className="mt-3 text-sm font-medium tabular-nums">Budget {inr(post.budget)} · Move-in {formatDate(post.moveIn)} · {post.durationMonths} months</p>
          </article>
        ))}
      </div>
      {posts.length === 0 ? <div className="mt-6"><Empty title="No requests in this city" body="Post what you need, or look at another city." /></div> : null}
    </AppShell>
  );
}
