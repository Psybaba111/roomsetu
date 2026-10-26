import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

function str(v: unknown, max = 200) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function numOrNull(v: unknown) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export type SearchInput = {
  city: string;
  locality: string;
  maxRent: number | null;
  roomType: string;
  furnished: string;
  gender: string;
  food: string;
  amenities: string;
  sort: string;
  lat: number | null;
  lng: number | null;
  q: string;
};

export type ListingCard = {
  id: string;
  title: string;
  cityId: string;
  cityName: string;
  localityName: string;
  monthlyRent: number;
  deposit: number;
  roomType: string;
  furnished: string;
  availableFrom: string;
  genderPref: string;
  foodAvailable: boolean;
  verificationStatus: string;
  isDemo: boolean;
  featured: boolean;
  coverImage: string;
  qualityScore: number;
  hostName: string;
  lat: number | null;
  lng: number | null;
};

function card(row: Record<string, unknown>): ListingCard {
  return {
    id: String(row.id),
    title: String(row.title),
    cityId: String(row.cityId),
    cityName: String(row.cityName),
    localityName: String(row.localityName),
    monthlyRent: Number(row.monthlyRent),
    deposit: Number(row.deposit),
    roomType: String(row.roomType),
    furnished: String(row.furnished),
    availableFrom: String(row.availableFrom).slice(0, 10),
    genderPref: String(row.genderPref),
    foodAvailable: Boolean(row.foodAvailable),
    verificationStatus: String(row.verificationStatus),
    isDemo: Boolean(row.isDemo),
    featured: Boolean(row.featured),
    coverImage: String(row.coverImage),
    qualityScore: Number(row.qualityScore),
    hostName: String(row.hostName ?? "Host"),
    lat: row.lat == null ? null : Math.round(Number(row.lat) * 100) / 100,
    lng: row.lng == null ? null : Math.round(Number(row.lng) * 100) / 100,
  };
}

const CARD_SQL = `
  l.id, l.title, c.id as "cityId", c.name as "cityName", loc.name as "localityName",
  l.monthly_rent as "monthlyRent", l.deposit, l.room_type as "roomType", l.furnished,
  l.available_from::text as "availableFrom", l.gender_pref as "genderPref",
  l.food_available as "foodAvailable", l.verification_status as "verificationStatus",
  l.is_demo as "isDemo",
  (l.featured and (l.featured_until is null or l.featured_until > now())) as featured,
  l.cover_image as "coverImage",
  l.quality_score as "qualityScore", coalesce(p.full_name, 'Host') as "hostName",
  l.lat, l.lng
`;

export const listCities = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const cities = await sql<{ id: string; name: string; state: string }>`
    select id, name, state from cities order by sort_order, name
  `;
  const localities = await sql<{ id: string; cityId: string; name: string }>`
    select id, city_id as "cityId", name from localities order by name
  `;
  return { cities, localities };
});

export const searchListings = createServerFn({ method: "GET" })
  .validator((input: unknown): SearchInput => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const maxRent = numOrNull(o.maxRent);
    return {
      city: str(o.city, 40),
      locality: str(o.locality, 80),
      maxRent: maxRent && maxRent > 0 ? Math.round(maxRent) : null,
      roomType: str(o.roomType, 20),
      furnished: str(o.furnished, 20),
      gender: str(o.gender, 20),
      food: str(o.food, 8),
      amenities: str(o.amenities, 120),
      sort: str(o.sort, 20) || "recommended",
      lat: numOrNull(o.lat),
      lng: numOrNull(o.lng),
      q: str(o.q, 80),
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const clauses = ["l.status = 'active'", "coalesce(p.suspended, false) = false"];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      clauses.push(clause.replaceAll("$#", `$${params.length}`));
    };
    if (data.city) add("l.city_id = $#", data.city);
    if (data.locality) add("l.locality_id = $#", data.locality);
    if (data.maxRent) add("l.monthly_rent <= $#", data.maxRent);
    if (data.roomType) add("l.room_type = $#", data.roomType);
    if (data.furnished) add("l.furnished = $#", data.furnished);
    if (data.gender) add("l.gender_pref = $#", data.gender);
    if (data.food === "yes") clauses.push("l.food_available = true");
    if (data.q) {
      const like = `%${data.q.replaceAll("%", "").replaceAll("_", "")}%`;
      params.push(like);
      const p = `$${params.length}`;
      clauses.push(`(l.title ilike ${p} or loc.name ilike ${p} or c.name ilike ${p})`);
    }
    const amenities = data.amenities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^[a-z0-9_]+$/.test(item))
      .slice(0, 8);
    if (amenities.length) {
      const holders = amenities.map((item) => {
        params.push(item);
        return `$${params.length}`;
      });
      clauses.push(
        `(select count(distinct amenity_id) from listing_amenities la where la.listing_id = l.id and la.amenity_id in (${holders.join(",")})) = ${amenities.length}`,
      );
    }
    const sorts: Record<string, string> = {
      recommended: "(case when l.featured and (l.featured_until is null or l.featured_until > now()) then 1 else 0 end) desc, l.quality_score desc, l.created_at desc",
      rent_asc: "l.monthly_rent asc",
      rent_desc: "l.monthly_rent desc",
      newest: "l.created_at desc",
      soon: "l.available_from asc",
    };
    let order = sorts[data.sort] ?? sorts.recommended;
    if (data.sort === "nearest" && data.lat != null && data.lng != null && Math.abs(data.lat) <= 90 && Math.abs(data.lng) <= 180) {
      params.push(data.lat, data.lng);
      order = `(power(coalesce(l.lat, 0) - $${params.length - 1}, 2) + power(coalesce(l.lng, 0) - $${params.length}, 2)) asc`;
    }
    const rows = await sql.query<Record<string, unknown>>(
      `select ${CARD_SQL}
       from listings l
       join cities c on c.id = l.city_id
       join localities loc on loc.id = l.locality_id
       left join profiles p on p.user_id = l.owner_id
       where ${clauses.join(" and ")}
       order by ${order}
       limit 60`,
      params,
    );
    return rows.map(card);
  });

export const getListing = createServerFn({ method: "GET" })
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select l.id, l.title, l.description, l.house_rules as "houseRules",
        l.property_type as "propertyType", l.room_type as "roomType", l.furnished,
        l.monthly_rent as "monthlyRent", l.deposit, l.available_from::text as "availableFrom",
        l.min_stay_months as "minStay", l.max_stay_months as "maxStay",
        l.gender_pref as "genderPref", l.occupant_pref as "occupantPref", l.roommate_pref as "roommatePref",
        l.occupants, l.guest_policy as "guestPolicy", l.age_min as "ageMin", l.age_max as "ageMax",
        l.food_available as "foodAvailable", l.smoking_allowed as "smokingAllowed", l.pets_allowed as "petsAllowed",
        l.verification_status as "verificationStatus", l.is_demo as "isDemo",
        (l.featured and (l.featured_until is null or l.featured_until > now())) as featured,
        l.quality_score as "qualityScore", l.views, l.plan, l.status, l.cover_image as "coverImage",
        l.owner_id as "ownerId", l.lat, l.lng,
        c.id as "cityId", c.name as "cityName", loc.name as "localityName",
        p.full_name as "hostName", p.occupation as "hostOccupation", p.age as "hostAge",
        p.gender as "hostGender", p.verification_status as "hostVerification",
        p.created_at::text as "hostSince", p.about as "hostAbout", p.is_demo as "hostDemo",
        p.privacy as privacy
      from listings l
      join cities c on c.id = l.city_id
      join localities loc on loc.id = l.locality_id
      left join profiles p on p.user_id = l.owner_id
      where l.id = $1 and l.status <> 'removed' and coalesce(p.suspended, false) = false`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const photos = await sql<{ url: string; category: string }>`
      select url, category from listing_photos where listing_id = ${id} order by sort_order
    `;
    const amenities = await sql<{ id: string; label: string }>`
      select a.id, a.label from listing_amenities la join amenities a on a.id = la.amenity_id
      where la.listing_id = ${id} order by a.label
    `;
    return {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ""),
      houseRules: String(row.houseRules ?? ""),
      propertyType: String(row.propertyType),
      roomType: String(row.roomType),
      furnished: String(row.furnished),
      monthlyRent: Number(row.monthlyRent),
      deposit: Number(row.deposit),
      availableFrom: String(row.availableFrom).slice(0, 10),
      minStay: Number(row.minStay),
      maxStay: row.maxStay == null ? null : Number(row.maxStay),
      genderPref: String(row.genderPref),
      occupantPref: String(row.occupantPref),
      roommatePref: String(row.roommatePref ?? ""),
      occupants: Number(row.occupants ?? 0),
      guestPolicy: String(row.guestPolicy ?? ""),
      ageMin: row.ageMin == null ? null : Number(row.ageMin),
      ageMax: row.ageMax == null ? null : Number(row.ageMax),
      foodAvailable: Boolean(row.foodAvailable),
      smokingAllowed: Boolean(row.smokingAllowed),
      petsAllowed: Boolean(row.petsAllowed),
      verificationStatus: String(row.verificationStatus),
      isDemo: Boolean(row.isDemo),
      featured: Boolean(row.featured),
      qualityScore: Number(row.qualityScore),
      views: Number(row.views),
      plan: String(row.plan),
      status: String(row.status),
      coverImage: String(row.coverImage),
      ownerId: String(row.ownerId),
      lat: row.lat == null ? null : Math.round(Number(row.lat) * 100) / 100,
      lng: row.lng == null ? null : Math.round(Number(row.lng) * 100) / 100,
      cityId: String(row.cityId),
      cityName: String(row.cityName),
      localityName: String(row.localityName),
      hostName: String(row.hostName ?? "Host"),
      hostOccupation: String(row.hostOccupation ?? ""),
      hostAge: row.hostAge == null ? null : Number(row.hostAge),
      hostGender: String(row.hostGender ?? ""),
      hostVerification: String(row.hostVerification ?? "unverified"),
      hostSince: String(row.hostSince ?? "").slice(0, 10),
      hostAbout:
        row.privacy && typeof row.privacy === "object" && (row.privacy as { profile?: string }).profile === "private"
          ? ""
          : String(row.hostAbout ?? ""),
      hostDemo: Boolean(row.hostDemo),
      photos,
      amenities,
    };
  });

export const recordView = createServerFn({ method: "POST" })
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ data: id }) => {
    if (!id) return { ok: false };
    const sql = await getSql();
    await sql`update listings set views = views + 1 where id = ${id} and status = 'active'`;
    return { ok: true };
  });

export const listRoomWanted = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { city: str(o.city, 40) };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = data.city
      ? await sql<Record<string, unknown>>`
          select w.id, w.name, w.age, w.gender, w.occupation, w.city_id as "cityId", c.name as "cityName",
            w.localities, w.budget, w.move_in::text as "moveIn", w.duration_months as "durationMonths",
            w.room_pref as "roomPref", w.furnished, w.bio, w.is_demo as "isDemo", w.lifestyle,
            w.food_pref as "foodPref", w.smoking, w.pets, w.people, w.roommate_gender as "roommateGender"
          from room_wanted w join cities c on c.id = w.city_id
          where w.status = 'active' and w.city_id = ${data.city}
          order by w.created_at desc limit 60`
      : await sql<Record<string, unknown>>`
          select w.id, w.name, w.age, w.gender, w.occupation, w.city_id as "cityId", c.name as "cityName",
            w.localities, w.budget, w.move_in::text as "moveIn", w.duration_months as "durationMonths",
            w.room_pref as "roomPref", w.furnished, w.bio, w.is_demo as "isDemo", w.lifestyle,
            w.food_pref as "foodPref", w.smoking, w.pets, w.people, w.roommate_gender as "roommateGender"
          from room_wanted w join cities c on c.id = w.city_id
          where w.status = 'active'
          order by w.created_at desc limit 60`;
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      age: row.age == null ? null : Number(row.age),
      gender: String(row.gender),
      occupation: String(row.occupation),
      cityId: String(row.cityId),
      cityName: String(row.cityName),
      localities: String(row.localities ?? ""),
      budget: Number(row.budget),
      moveIn: String(row.moveIn).slice(0, 10),
      durationMonths: Number(row.durationMonths),
      roomPref: String(row.roomPref),
      furnished: String(row.furnished),
      bio: String(row.bio ?? ""),
      isDemo: Boolean(row.isDemo),
      lifestyle: String(row.lifestyle ?? ""),
      foodPref: String(row.foodPref),
      smoking: String(row.smoking),
      pets: String(row.pets),
      people: Number(row.people),
      roommateGender: String(row.roommateGender),
    }));
  });
