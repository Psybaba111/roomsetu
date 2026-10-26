import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { localityHit, pickBuddies, seatsFor, type BuddySeeker } from "@/lib/roomsetu/buddy";

function str(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

type ListingRow = {
  id: string;
  ownerId: string;
  listingKind: string;
  roomType: string;
  monthlyRent: number;
  genderPref: string;
  availableFrom: string;
  cityId: string;
  localityId: string;
  localityName: string;
  title: string;
  cityName: string;
};

export type BuddyPersonView = {
  wantedId: string;
  userId: string;
  name: string;
  age: number | null;
  gender: string;
  occupation: string;
  budget: number;
  moveIn: string;
  isDemo: boolean;
  status: string;
  reasons: string[];
};

export type BuddyView = {
  needed: boolean;
  seats: number;
  listingId: string;
  title: string;
  localityName: string;
  cityName: string;
  monthlyRent: number;
  share: number;
  summary: string;
  coversRent: boolean;
  combinedBudget: number;
  confirmed: number;
  people: BuddyPersonView[];
  club: { id: string; status: string; isDemo: boolean; note: string } | null;
  ownerId: string;
};

const emptyView = (listingId: string): BuddyView => ({
  needed: false,
  seats: 0,
  listingId,
  title: "",
  localityName: "",
  cityName: "",
  monthlyRent: 0,
  share: 0,
  summary: "",
  coversRent: false,
  combinedBudget: 0,
  confirmed: 0,
  people: [],
  club: null,
  ownerId: "",
});

async function loadListing(sql: Sql, id: string): Promise<ListingRow | null> {
  const rows = await sql<Record<string, unknown>>`
    select l.id, l.owner_id as "ownerId", l.listing_kind as "listingKind", l.room_type as "roomType",
      l.monthly_rent as "monthlyRent", l.gender_pref as "genderPref", l.available_from::text as "availableFrom",
      l.city_id as "cityId", l.locality_id as "localityId", loc.name as "localityName", l.title, c.name as "cityName"
    from listings l
    join localities loc on loc.id = l.locality_id
    join cities c on c.id = l.city_id
    where l.id = ${id} and l.status = 'active'`;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    ownerId: String(row.ownerId),
    listingKind: String(row.listingKind ?? "room"),
    roomType: String(row.roomType),
    monthlyRent: Number(row.monthlyRent),
    genderPref: String(row.genderPref),
    availableFrom: String(row.availableFrom).slice(0, 10),
    cityId: String(row.cityId),
    localityId: String(row.localityId),
    localityName: String(row.localityName),
    title: String(row.title),
    cityName: String(row.cityName),
  };
}

async function loadSeekers(sql: Sql, cityId: string): Promise<BuddySeeker[]> {
  const rows = await sql<Record<string, unknown>>`
    select id, owner_id as "userId", name, age, gender, occupation, localities, budget,
      move_in::text as "moveIn", roommate_gender as "roommateGender", is_demo as "isDemo"
    from room_wanted
    where status = 'active' and city_id = ${cityId}`;
  return rows.map((row) => ({
    wantedId: String(row.id),
    userId: String(row.userId),
    name: String(row.name),
    age: row.age == null ? null : Number(row.age),
    gender: String(row.gender),
    occupation: String(row.occupation),
    localities: String(row.localities ?? ""),
    budget: Number(row.budget),
    moveIn: String(row.moveIn).slice(0, 10),
    roommateGender: String(row.roommateGender ?? "any"),
    isDemo: Boolean(row.isDemo),
  }));
}

async function viewFor(sql: Sql, listing: ListingRow): Promise<BuddyView> {
  const seats = listing.listingKind === "entire" ? seatsFor(listing.roomType) : 0;
  if (seats < 2) return emptyView(listing.id);
  const share = Math.ceil(listing.monthlyRent / seats);
  const clubs = await sql<Record<string, unknown>>`
    select id, status, note, is_demo as "isDemo"
    from flat_clubs
    where listing_id = ${listing.id} and status in ('forming', 'proposed', 'accepted')
    order by created_at desc
    limit 1`;
  const clubRow = clubs[0];
  let people: BuddyPersonView[] = [];
  let summary = "";
  let combinedBudget = 0;
  let coversRent = false;
  if (clubRow) {
    const members = await sql<Record<string, unknown>>`
      select m.user_id as "userId", m.wanted_id as "wantedId", m.status,
        coalesce(w.name, p.full_name, 'Member') as name,
        coalesce(w.occupation, p.occupation, '') as occupation,
        coalesce(w.budget, 0) as budget,
        coalesce(w.age, p.age) as age,
        coalesce(w.gender, p.gender, '') as gender,
        coalesce(w.move_in::text, '') as "moveIn",
        coalesce(w.is_demo, false) as "isDemo"
      from flat_club_members m
      left join room_wanted w on w.id = m.wanted_id
      left join profiles p on p.user_id = m.user_id
      where m.club_id = ${String(clubRow.id)}
      order by m.created_at`;
    people = members.map((row) => {
      const budget = Number(row.budget);
      const status = String(row.status);
      return {
        wantedId: String(row.wantedId ?? ""),
        userId: String(row.userId),
        name: String(row.name),
        age: row.age == null ? null : Number(row.age),
        gender: String(row.gender ?? ""),
        occupation: String(row.occupation ?? ""),
        budget,
        moveIn: String(row.moveIn ?? "").slice(0, 10),
        isDemo: Boolean(row.isDemo),
        status,
        reasons: [
          status === "in" ? "Confirmed for this flat" : "Suggested, not confirmed yet",
          `Share of the rent is about ${share.toLocaleString("en-IN")} rupees`,
        ],
      };
    });
    combinedBudget = people.reduce((sum, person) => sum + person.budget, 0);
    coversRent = combinedBudget >= listing.monthlyRent && people.filter((person) => person.status === "in").length >= seats;
    summary = String(clubRow.note || `${people.filter((person) => person.status === "in").length} of ${seats} confirmed for ${listing.localityName}.`);
  } else {
    const pick = pickBuddies({
      localityName: listing.localityName,
      genderPref: listing.genderPref,
      monthlyRent: listing.monthlyRent,
      availableFrom: listing.availableFrom,
      seats,
      seekers: await loadSeekers(sql, listing.cityId),
    });
    people = pick.people.map((person) => ({ ...person, status: "match" }));
    summary = pick.summary;
    combinedBudget = pick.combinedBudget;
    coversRent = pick.coversRent;
  }
  const confirmed = people.filter((person) => person.status === "in").length;
  return {
    needed: true,
    seats,
    listingId: listing.id,
    title: listing.title,
    localityName: listing.localityName,
    cityName: listing.cityName,
    monthlyRent: listing.monthlyRent,
    share,
    summary,
    coversRent,
    combinedBudget,
    confirmed,
    people,
    club: clubRow
      ? { id: String(clubRow.id), status: String(clubRow.status), isDemo: Boolean(clubRow.isDemo), note: String(clubRow.note ?? "") }
      : null,
    ownerId: listing.ownerId,
  };
}

export const buddyForListing = createServerFn({ method: "GET" })
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ data: id }) => {
    if (!id) return emptyView("");
    const sql = await getSql();
    const listing = await loadListing(sql, id);
    if (!listing) return emptyView(id);
    return viewFor(sql, listing);
  });

export const myBuddyBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const wants = await sql<{ localities: string; cityId: string }>`
      select localities, city_id as "cityId" from room_wanted
      where owner_id = ${context.userId} and status = 'active'`;
    const cities = [...new Set(wants.map((row) => row.cityId))];
    const suggestions: BuddyView[] = [];
    if (cities.length) {
      const listings = await sql<Record<string, unknown>>`
        select l.id, l.city_id as "cityId", loc.name as "localityName"
        from listings l
        join localities loc on loc.id = l.locality_id
        where l.status = 'active' and l.listing_kind = 'entire' and l.room_type in ('2bhk', '3bhk', '4bhk')
        order by l.created_at desc
        limit 80`;
      for (const row of listings) {
        if (suggestions.length >= 6) break;
        const cityId = String(row.cityId);
        const localityName = String(row.localityName);
        const named = wants.some((want) => want.cityId === cityId && localityHit(want.localities, localityName));
        if (!named) continue;
        const listing = await loadListing(sql, String(row.id));
        if (listing) suggestions.push(await viewFor(sql, listing));
      }
    }
    const mine = await sql<{ id: string }>`
      select c.listing_id as id
      from flat_clubs c
      join flat_club_members m on m.club_id = c.id
      where m.user_id = ${context.userId} and c.status in ('forming', 'proposed', 'accepted')
      order by c.updated_at desc
      limit 8`;
    const groups: BuddyView[] = [];
    for (const row of mine) {
      const listing = await loadListing(sql, row.id);
      if (listing) groups.push(await viewFor(sql, listing));
    }
    return { suggestions, groups, hasWanted: wants.length > 0 };
  });

export const joinBuddy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: listingId }) => {
    const sql = await getSql();
    const listing = await loadListing(sql, listingId);
    if (!listing) throw new Error("That flat is not open.");
    const seats = listing.listingKind === "entire" ? seatsFor(listing.roomType) : 0;
    if (seats < 2) throw new Error("Buddy up is for a whole 2, 3, or 4 BHK.");
    const wants = await sql<Record<string, unknown>>`
      select id, localities from room_wanted
      where owner_id = ${context.userId} and status = 'active' and city_id = ${listing.cityId}`;
    const fit = wants.find((row) => localityHit(String(row.localities ?? ""), listing.localityName));
    if (!fit) throw new Error(`Post a room request that names ${listing.localityName} before you join.`);
    const open = await sql<{ id: string; status: string; seats: number }>`
      select id, status, seats from flat_clubs
      where listing_id = ${listing.id} and status in ('forming', 'proposed', 'accepted')
      limit 1`;
    if (open[0]?.status === "accepted") throw new Error("The owner already accepted a group for this flat.");
    if (open[0]?.status === "proposed") throw new Error("This group has already gone to the owner.");
    if (open[0]) {
      const clubId = open[0].id;
      const membership = await sql<{ status: string }>`
        select status from flat_club_members where club_id = ${clubId} and user_id = ${context.userId}`;
      if (membership[0]?.status === "in") return { clubId, status: "in" };
      if (membership[0]) {
        await sql`update flat_club_members set status = 'in' where club_id = ${clubId} and user_id = ${context.userId}`;
        return { clubId, status: "in" };
      }
      const confirmed = await sql<{ n: number }>`
        select count(*) as n from flat_club_members where club_id = ${clubId} and status = 'in'`;
      if (Number(confirmed[0]?.n ?? 0) >= seats) throw new Error("This group is full.");
      await sql`insert into flat_club_members (club_id, user_id, wanted_id, status)
        values (${clubId}, ${context.userId}, ${String(fit.id)}, 'in')`;
      return { clubId, status: "in" };
    }
    const pick = pickBuddies({
      localityName: listing.localityName,
      genderPref: listing.genderPref,
      monthlyRent: listing.monthlyRent,
      availableFrom: listing.availableFrom,
      seats,
      seekers: await loadSeekers(sql, listing.cityId),
    });
    const clubId = crypto.randomUUID();
    await sql`insert into flat_clubs (id, listing_id, city_id, locality_id, seats, status, note, is_demo, created_by)
      values (${clubId}, ${listing.id}, ${listing.cityId}, ${listing.localityId}, ${seats}, 'forming',
        ${`Group forming for ${listing.localityName}.`}, false, ${context.userId})`;
    await sql`insert into flat_club_members (club_id, user_id, wanted_id, status)
      values (${clubId}, ${context.userId}, ${String(fit.id)}, 'in')`;
    for (const person of pick.people) {
      if (person.userId === context.userId) continue;
      const count = await sql<{ n: number }>`select count(*) as n from flat_club_members where club_id = ${clubId}`;
      if (Number(count[0]?.n ?? 0) >= seats) break;
      await sql`insert into flat_club_members (club_id, user_id, wanted_id, status)
        values (${clubId}, ${person.userId}, ${person.wantedId}, 'suggested')
        on conflict (club_id, user_id) do nothing`;
    }
    return { clubId, status: "forming" };
  });

export const proposeBuddy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { clubId: str(o.clubId, 80), note: str(o.note, 400) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const clubs = await sql<Record<string, unknown>>`
      select c.id, c.seats, c.status, c.listing_id as "listingId", l.owner_id as "ownerId", l.title, loc.name as "localityName"
      from flat_clubs c
      join listings l on l.id = c.listing_id
      join localities loc on loc.id = l.locality_id
      where c.id = ${data.clubId}`;
    const club = clubs[0];
    if (!club || String(club.status) !== "forming") throw new Error("This group is not ready to send.");
    const members = await sql<{ userId: string; status: string }>`
      select user_id as "userId", status from flat_club_members where club_id = ${data.clubId}`;
    if (!members.some((member) => member.userId === context.userId && member.status === "in")) {
      throw new Error("Confirm your seat before the group goes to the owner.");
    }
    const confirmed = members.filter((member) => member.status === "in").length;
    if (confirmed < Number(club.seats)) throw new Error(`Need ${club.seats} confirmed people. ${confirmed} are in.`);
    const note = data.note || `A full group from ${String(club.localityName)} wants to rent this flat together.`;
    await sql`update flat_clubs set status = 'proposed', note = ${note}, updated_at = now() where id = ${data.clubId}`;
    const ownerId = String(club.ownerId);
    if (!ownerId.startsWith("demo:")) {
      await sql`insert into notifications (id, user_id, kind, title, body, href)
        values (${crypto.randomUUID()}, ${ownerId}, 'buddy', 'A group wants your flat', ${note}, ${`/listing/${String(club.listingId)}`})`;
    }
    return { ok: true };
  });

export const answerBuddy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const status = str(o.status, 20);
    if (status !== "accepted" && status !== "declined") throw new Error("Choose accept or pass.");
    return { clubId: str(o.clubId, 80), status };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select c.id from flat_clubs c
      join listings l on l.id = c.listing_id
      where c.id = ${data.clubId} and l.owner_id = ${context.userId} and c.status = 'proposed'`;
    if (!owned[0]) throw new Error("That proposal is not yours to answer.");
    await sql`update flat_clubs set status = ${data.status}, updated_at = now() where id = ${data.clubId}`;
    const members = await sql<{ userId: string }>`select user_id as "userId" from flat_club_members where club_id = ${data.clubId} and status = 'in'`;
    for (const member of members) {
      if (member.userId.startsWith("demo:")) continue;
      await sql`insert into notifications (id, user_id, kind, title, body, href)
        values (${crypto.randomUUID()}, ${member.userId}, 'buddy',
          ${data.status === "accepted" ? "The owner accepted your group" : "The owner passed on your group"},
          ${data.status === "accepted" ? "Message them inside RoomSetu to arrange a visit. Phone numbers stay hidden." : "You can buddy up on another flat."},
          '/buddies')`;
    }
    return { ok: true };
  });

export const ownerBuddyInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select c.id, c.status, c.note, c.is_demo as "isDemo", c.seats, l.id as "listingId", l.title,
        loc.name as "localityName", l.monthly_rent as "monthlyRent"
      from flat_clubs c
      join listings l on l.id = c.listing_id
      join localities loc on loc.id = l.locality_id
      where l.owner_id = ${context.userId} and c.status in ('proposed', 'accepted')
      order by c.updated_at desc
      limit 12`;
    const items = [];
    for (const row of rows) {
      const members = await sql<{ name: string }>`
        select coalesce(w.name, p.full_name, 'Member') as name
        from flat_club_members m
        left join room_wanted w on w.id = m.wanted_id
        left join profiles p on p.user_id = m.user_id
        where m.club_id = ${String(row.id)} and m.status = 'in'`;
      items.push({
        id: String(row.id),
        status: String(row.status),
        note: String(row.note ?? ""),
        isDemo: Boolean(row.isDemo),
        seats: Number(row.seats),
        listingId: String(row.listingId),
        title: String(row.title),
        localityName: String(row.localityName),
        monthlyRent: Number(row.monthlyRent),
        names: members.map((member) => member.name),
      });
    }
    return items;
  });
