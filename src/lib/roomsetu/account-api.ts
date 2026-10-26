import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { matchScore, type SeekerPrefs } from "@/lib/roomsetu/match";
import { isAllowedPhotoUrl } from "@/lib/roomsetu/storage";
import { parseFacts, type PropertyFacts } from "@/lib/roomsetu/catalog";
import { planById, type PlanId } from "@/lib/roomsetu/payments";
import { rowsOf } from "@/lib/roomsetu/plain";

function str(v: unknown, max = 400) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
function obj(v: unknown): Record<string, string> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
    } catch {
      return {};
    }
  }
  if (typeof v === "object") return v as Record<string, string>;
  return {};
}

function mapProfile(row: Record<string, unknown>) {
  return {
    userId: String(row.user_id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    mobile: String(row.mobile ?? ""),
    age: row.age == null ? null : Number(row.age),
    gender: String(row.gender ?? ""),
    cityId: row.city_id == null ? "" : String(row.city_id),
    occupation: String(row.occupation ?? ""),
    userType: String(row.user_type ?? "looking"),
    preferredCities: String(row.preferred_cities ?? ""),
    about: String(row.about ?? ""),
    lifestyle: obj(row.lifestyle),
    privacy: obj(row.privacy),
    role: String(row.role ?? "member"),
    verificationStatus: String(row.verification_status ?? "unverified"),
    phoneVerified: Boolean(row.phone_verified),
    emailVerified: Boolean(row.email_verified),
    suspended: Boolean(row.suspended),
    isDemo: Boolean(row.is_demo),
    createdAt: String(row.created_at ?? ""),
    premiumUntil: row.premium_until ? String(row.premium_until).slice(0, 10) : "",
  };
}

async function loadProfile(sql: Sql, userId: string) {
  const rows = await sql<Record<string, unknown>>`select * from profiles where user_id = ${userId}`;
  return rows[0] ? mapProfile(rows[0]) : null;
}

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { fullName: str(o.fullName, 80), email: str(o.email, 160) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${context.userId}`;
    if (existing.length === 0) {
      const admins = await sql`select user_id from profiles where role = 'super_admin' limit 1`;
      const role = admins.length === 0 ? "super_admin" : "member";
      await sql`insert into profiles (user_id, full_name, email, role, last_seen_at)
        values (${context.userId}, ${data.fullName || "New member"}, ${data.email}, ${role}, now())`;
    } else {
      await sql`update profiles set
        full_name = case when full_name = '' and ${data.fullName} <> '' then ${data.fullName} else full_name end,
        email = case when email = '' and ${data.email} <> '' then ${data.email} else email end,
        last_seen_at = now(), updated_at = now()
        where user_id = ${context.userId}`;
    }
    return loadProfile(sql, context.userId);
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const lifestyle = obj(o.lifestyle);
    const privacyIn = obj(o.privacy);
    const profileVis = ["public", "private"].includes(privacyIn.profile) ? privacyIn.profile : "public";
    return {
      fullName: str(o.fullName, 80),
      mobile: str(o.mobile, 20),
      age: o.age == null || o.age === "" ? null : Math.min(99, Math.max(16, num(o.age))),
      gender: str(o.gender, 20),
      cityId: str(o.cityId, 40),
      occupation: str(o.occupation, 80),
      userType: ["looking", "offering", "both"].includes(str(o.userType, 20)) ? str(o.userType, 20) : "looking",
      preferredCities: str(o.preferredCities, 200),
      about: str(o.about, 800),
      lifestyle,
      privacy: { profile: profileVis, contact: "hidden", listing: "public" },
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update profiles set
      full_name = ${data.fullName}, mobile = ${data.mobile}, age = ${data.age}, gender = ${data.gender},
      city_id = ${data.cityId || null}, occupation = ${data.occupation}, user_type = ${data.userType},
      preferred_cities = ${data.preferredCities}, about = ${data.about},
      lifestyle = ${JSON.stringify(data.lifestyle)}::jsonb,
      privacy = ${JSON.stringify(data.privacy)}::jsonb,
      updated_at = now()
      where user_id = ${context.userId}`;
    return loadProfile(sql, context.userId);
  });

type ListingWrite = {
  id: string;
  title: string;
  propertyType: string;
  roomType: string;
  address: string;
  cityId: string;
  localityId: string;
  pincode: string;
  monthlyRent: number;
  deposit: number;
  availableFrom: string;
  minStayMonths: number;
  maxStayMonths: number | null;
  furnished: string;
  genderPref: string;
  ageMin: number | null;
  ageMax: number | null;
  occupantPref: string;
  roommatePref: string;
  occupants: number;
  description: string;
  houseRules: string;
  guestPolicy: string;
  amenities: string[];
  photos: { url: string; category: string }[];
  listingKind: "room" | "entire";
  facts: PropertyFacts;
};

function parseListing(input: unknown): ListingWrite {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const amenities = Array.isArray(o.amenities)
    ? o.amenities.map((item) => str(item, 40)).filter((item) => /^[a-z0-9_]+$/.test(item)).slice(0, 20)
    : [];
  const photos = Array.isArray(o.photos)
    ? o.photos
        .map((item) => {
          const photo = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
          return { url: str(photo.url, 400), category: str(photo.category, 40) || "Bedroom" };
        })
        .filter((photo) => isAllowedPhotoUrl(photo.url))
        .slice(0, 8)
    : [];
  const available = str(o.availableFrom, 10);
  const listingKind = o.listingKind === "entire" ? "entire" : "room";
  let roomType = str(o.roomType, 20) || (listingKind === "entire" ? "2bhk" : "private");
  if (listingKind === "entire" && !["studio", "1bhk", "2bhk", "3bhk", "4bhk"].includes(roomType)) roomType = "2bhk";
  return {
    id: str(o.id, 80),
    title: str(o.title, 120),
    propertyType: str(o.propertyType, 40) || "apartment",
    roomType,
    address: str(o.address, 200),
    cityId: str(o.cityId, 40),
    localityId: str(o.localityId, 80),
    pincode: str(o.pincode, 8),
    monthlyRent: Math.min(500000, Math.max(500, num(o.monthlyRent))),
    deposit: Math.min(2000000, Math.max(0, num(o.deposit))),
    availableFrom: /^\d{4}-\d{2}-\d{2}$/.test(available) ? available : new Date().toISOString().slice(0, 10),
    minStayMonths: Math.min(36, Math.max(1, num(o.minStayMonths, 1))),
    maxStayMonths: o.maxStayMonths == null || o.maxStayMonths === "" ? null : Math.min(60, num(o.maxStayMonths)),
    furnished: str(o.furnished, 20) || "semi",
    genderPref: str(o.genderPref, 20) || "any",
    ageMin: o.ageMin == null || o.ageMin === "" ? null : num(o.ageMin),
    ageMax: o.ageMax == null || o.ageMax === "" ? null : num(o.ageMax),
    occupantPref: str(o.occupantPref, 20) || "any",
    roommatePref: str(o.roommatePref, 160),
    occupants: Math.min(20, Math.max(0, num(o.occupants))),
    description: str(o.description, 2000),
    houseRules: str(o.houseRules, 800),
    guestPolicy: str(o.guestPolicy, 160) || "Occasional guests with notice",
    amenities,
    photos,
    listingKind,
    facts: parseFacts(o.facts),
  };
}

const FLAG: Record<string, string> = {
  wifi: "wifi",
  ac: "ac",
  kitchen: "kitchen",
  washing: "washing",
  parking: "parking",
  backup: "backup",
  lift: "lift",
  housekeeping: "housekeeping",
  attached_bath: "attached_bath",
  balcony: "balcony",
  food: "food",
  security: "security",
  gas: "gas",
  gym: "gym",
  club: "club",
  park: "park",
};

function quality(data: ListingWrite, verified: boolean) {
  let score = 48;
  if (data.description.length > 80) score += 10;
  if (data.photos.length >= 3) score += 12;
  else if (data.photos.length >= 1) score += 6;
  if (data.amenities.length >= 4) score += 10;
  if (data.houseRules.length > 10) score += 6;
  if (data.address) score += 4;
  if (data.listingKind === "entire" && data.facts.builtUpSqft && data.facts.society) score += 6;
  if (verified) score += 10;
  return Math.min(98, score);
}

export const saveListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(parseListing)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) throw new Error("Create your profile first.");
    if (profile.suspended) throw new Error("This account is suspended.");
    if (!data.title || !data.cityId || !data.localityId) throw new Error("Title, city, and locality are required.");
    const place = await sql<{ lat: number | null; lng: number | null }>`
      select lat, lng from localities where id = ${data.localityId} and city_id = ${data.cityId}`;
    if (!place[0]) throw new Error("Choose a locality in that city.");
    const dupes = await sql<{ id: string }>`
      select id from listings
      where owner_id = ${context.userId} and city_id = ${data.cityId} and locality_id = ${data.localityId}
        and room_type = ${data.roomType} and monthly_rent = ${data.monthlyRent}
        and status <> 'removed' and id <> ${data.id || ""}
      limit 1`;
    const id = data.id || crypto.randomUUID();
    if (data.id) {
      const owned = await sql`select id from listings where id = ${id} and owner_id = ${context.userId}`;
      if (!owned[0]) throw new Error("Listing not found.");
    }
    const has = (key: string) => data.amenities.includes(key);
    const cover = data.photos[0]?.url || (data.listingKind === "entire" ? "/rooms/living.jpg" : "/rooms/bedroom.jpg");
    const score = quality(data, profile.verificationStatus === "verified");
    const factsJson = JSON.stringify(data.listingKind === "entire" ? data.facts : { postedBy: "owner" });
    if (!data.id) {
      const propId = crypto.randomUUID();
      await sql`insert into properties (id, owner_id, title, property_type, city_id, locality_id, address, is_demo)
        values (${propId}, ${context.userId}, ${data.title}, ${data.propertyType}, ${data.cityId}, ${data.localityId}, ${data.address}, false)`;
      await sql`insert into listings (
        id, property_id, owner_id, is_demo, title, property_type, room_type, address, city_id, locality_id, pincode,
        lat, lng, monthly_rent, deposit, available_from, min_stay_months, max_stay_months, furnished, gender_pref,
        age_min, age_max, occupant_pref, roommate_pref, occupants, description, house_rules, guest_policy,
        food_available, smoking_allowed, pets_allowed, status, verification_status, quality_score, plan, featured,
        listing_kind, property_facts, cover_image, duplicate_suspect
      ) values (
        ${id}, ${propId}, ${context.userId}, false, ${data.title}, ${data.propertyType}, ${data.roomType}, ${data.address},
        ${data.cityId}, ${data.localityId}, ${data.pincode}, ${place[0].lat}, ${place[0].lng}, ${data.monthlyRent}, ${data.deposit},
        ${data.availableFrom}, ${data.minStayMonths}, ${data.maxStayMonths}, ${data.furnished}, ${data.genderPref},
        ${data.ageMin}, ${data.ageMax}, ${data.occupantPref}, ${data.roommatePref}, ${data.occupants}, ${data.description},
        ${data.houseRules}, ${data.guestPolicy}, ${has("food")}, false, false, 'active', 'unverified', ${score}, 'free', false,
        ${data.listingKind}, ${factsJson}::jsonb, ${cover}, ${Boolean(dupes[0])}
      )`;
    } else {
      await sql`update listings set
        title = ${data.title}, property_type = ${data.propertyType}, room_type = ${data.roomType}, address = ${data.address},
        city_id = ${data.cityId}, locality_id = ${data.localityId}, pincode = ${data.pincode},
        lat = ${place[0].lat}, lng = ${place[0].lng}, monthly_rent = ${data.monthlyRent}, deposit = ${data.deposit},
        available_from = ${data.availableFrom}, min_stay_months = ${data.minStayMonths}, max_stay_months = ${data.maxStayMonths},
        furnished = ${data.furnished}, gender_pref = ${data.genderPref}, age_min = ${data.ageMin}, age_max = ${data.ageMax},
        occupant_pref = ${data.occupantPref}, roommate_pref = ${data.roommatePref}, occupants = ${data.occupants},
        description = ${data.description}, house_rules = ${data.houseRules}, guest_policy = ${data.guestPolicy},
        food_available = ${has("food")}, quality_score = ${score}, cover_image = ${cover},
        listing_kind = ${data.listingKind}, property_facts = ${factsJson}::jsonb,
        duplicate_suspect = ${Boolean(dupes[0])}, updated_at = now()
        where id = ${id} and owner_id = ${context.userId}`;
      await sql`delete from listing_amenities where listing_id = ${id}`;
      await sql`delete from listing_photos where listing_id = ${id}`;
    }
    for (const amenity of data.amenities) {
      if (FLAG[amenity]) {
        await sql`insert into listing_amenities (listing_id, amenity_id) values (${id}, ${amenity}) on conflict do nothing`;
      }
    }
    for (let i = 0; i < data.photos.length; i++) {
      const photo = data.photos[i];
      await sql`insert into listing_photos (id, listing_id, url, category, sort_order)
        values (${`${id}:ph:${i}`}, ${id}, ${photo.url}, ${photo.category}, ${i})`;
    }
    if (!profile.userType || profile.userType === "looking") {
      await sql`update profiles set user_type = 'both', updated_at = now() where user_id = ${context.userId} and user_type = 'looking'`;
    }
    return { id, duplicate: Boolean(dupes[0]) };
  });

export const setListingStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const status = str(o.status, 20);
    if (!["active", "paused", "occupied", "removed"].includes(status)) throw new Error("Unknown status.");
    return { id: str(o.id, 80), status };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update listings set status = ${data.status}, updated_at = now()
      where id = ${data.id} and owner_id = ${context.userId}`;
    return { ok: true };
  });

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const purpose = str(o.purpose, 40);
    if (!planById(purpose)) throw new Error("Unknown plan.");
    return { purpose: purpose as PlanId, referenceId: str(o.referenceId, 80) };
  })
  .handler(async ({ context, data }) => {
    const { startCheckout } = await import("@/lib/roomsetu/payments.server");
    return startCheckout(context.userId, data.purpose, data.referenceId);
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return {
      paymentId: str(o.paymentId, 80),
      orderId: str(o.orderId, 80),
      providerPaymentId: str(o.providerPaymentId, 80),
      signature: str(o.signature, 256),
    };
  })
  .handler(async ({ context, data }) => {
    const { confirmCheckout: confirm } = await import("@/lib/roomsetu/payments.server");
    return confirm(context.userId, data);
  });

export const myPayments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{ id: string; purpose: string; amountInr: number; status: string; createdAt: string }>`
      select id, purpose, amount_inr as "amountInr", status, created_at::text as "createdAt"
      from payments
      where user_id = ${context.userId}
      order by created_at desc
      limit 20`;
  });

export const myListings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      status: string;
      monthlyRent: number;
      views: number;
      verificationStatus: string;
      qualityScore: number;
      cityName: string;
      coverImage: string;
      enquiries: number;
      boostRequested: boolean;
      plan: string;
      isDemo: boolean;
      featuredUntil: string;
    }>`
      select l.id, l.title, l.status, l.monthly_rent as "monthlyRent", l.views,
        l.verification_status as "verificationStatus", l.quality_score as "qualityScore",
        c.name as "cityName", l.cover_image as "coverImage", l.boost_requested as "boostRequested",
        l.plan, l.is_demo as "isDemo", coalesce(l.featured_until::text, '') as "featuredUntil",
        (select count(*) from conversations cv where cv.listing_id = l.id) as enquiries
      from listings l join cities c on c.id = l.city_id
      where l.owner_id = ${context.userId} and l.status <> 'removed'
      order by l.created_at desc
    `;
  });

export const toggleSaved = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const existing = await sql`select 1 as ok from saved_listings where user_id = ${context.userId} and listing_id = ${id}`;
    if (existing.length) {
      await sql`delete from saved_listings where user_id = ${context.userId} and listing_id = ${id}`;
      return { saved: false };
    }
    await sql`insert into saved_listings (user_id, listing_id) values (${context.userId}, ${id})`;
    return { saved: true };
  });

export const savedIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ listing_id: string }>`select listing_id from saved_listings where user_id = ${context.userId}`;
    return rows.map((row) => row.listing_id);
  });

export const savedListings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const raw = await sql<Record<string, unknown>>`
      select l.id, l.title, l.monthly_rent as "monthlyRent", l.cover_image as "coverImage",
        c.name as "cityName", loc.name as "localityName", l.room_type as "roomType",
        l.is_demo as "isDemo", l.verification_status as "verificationStatus"
      from saved_listings s
      join listings l on l.id = s.listing_id
      join cities c on c.id = l.city_id
      join localities loc on loc.id = l.locality_id
      where s.user_id = ${context.userId} and l.status = 'active'
      order by s.created_at desc
    `;
    return rowsOf<{
      id: string;
      title: string;
      monthlyRent: number;
      coverImage: string;
      cityName: string;
      localityName: string;
      roomType: string;
      isDemo: boolean;
      verificationStatus: string;
    }>(raw);
  });

export const applyToListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { listingId: str(o.listingId, 80), message: str(o.message, 800) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const listing = await sql<{ owner_id: string }>`select owner_id from listings where id = ${data.listingId} and status = 'active'`;
    if (!listing[0]) throw new Error("Listing is not open.");
    if (listing[0].owner_id === context.userId) throw new Error("You cannot apply to your own listing.");
    const id = crypto.randomUUID();
    await sql`insert into applications (id, listing_id, user_id, message) values (${id}, ${data.listingId}, ${context.userId}, ${data.message})`;
    if (!listing[0].owner_id.startsWith("demo:")) {
      await sql`insert into notifications (id, user_id, kind, title, body, href)
        values (${crypto.randomUUID()}, ${listing[0].owner_id}, 'application', 'New room application', ${data.message || "Someone applied to your listing."}, '/applications')`;
    }
    return { id };
  });

export const myApplications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const sent = await sql<Record<string, unknown>>`
      select a.id, a.status, a.message, a.created_at::text as "createdAt", l.title, l.id as "listingId", c.name as "cityName"
      from applications a join listings l on l.id = a.listing_id join cities c on c.id = l.city_id
      where a.user_id = ${context.userId} order by a.created_at desc`;
    const received = await sql<Record<string, unknown>>`
      select a.id, a.status, a.message, a.created_at::text as "createdAt", l.title, l.id as "listingId",
        p.full_name as "seekerName", p.occupation as "seekerOccupation"
      from applications a
      join listings l on l.id = a.listing_id
      left join profiles p on p.user_id = a.user_id
      where l.owner_id = ${context.userId} order by a.created_at desc`;
    return {
      sent: rowsOf<{ id: string; status: string; message: string; createdAt: string; title: string; listingId: string; cityName: string }>(sent),
      received: rowsOf<{ id: string; status: string; message: string; createdAt: string; title: string; listingId: string; seekerName: string; seekerOccupation: string }>(received),
    };
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const status = str(o.status, 20);
    if (!["accepted", "declined", "withdrawn"].includes(status)) throw new Error("Unknown status.");
    return { id: str(o.id, 80), status };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.status === "withdrawn") {
      await sql`update applications set status = 'withdrawn', updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}`;
      return { ok: true };
    }
    const rows = await sql<{ user_id: string }>`
      select a.user_id from applications a join listings l on l.id = a.listing_id
      where a.id = ${data.id} and l.owner_id = ${context.userId}`;
    if (!rows[0]) throw new Error("Application not found.");
    await sql`update applications set status = ${data.status}, updated_at = now() where id = ${data.id}`;
    if (data.status === "accepted") {
      await sql`insert into recorded_matches (id, seeker_id, listing_id, score)
        select ${crypto.randomUUID()}, a.user_id, a.listing_id, 100 from applications a where a.id = ${data.id}`;
    }
    await sql`insert into notifications (id, user_id, kind, title, href)
      values (${crypto.randomUUID()}, ${rows[0].user_id}, 'application', ${data.status === "accepted" ? "Application accepted" : "Application update"}, '/applications')`;
    return { ok: true };
  });

function prefsFrom(profile: NonNullable<Awaited<ReturnType<typeof loadProfile>>>, wanted: Record<string, unknown> | undefined): SeekerPrefs {
  const life = profile.lifestyle;
  return {
    cityId: wanted ? String(wanted.city_id) : profile.cityId || life.cityId || "",
    budget: wanted ? Number(wanted.budget) : life.budget ? Number(life.budget) : null,
    moveIn: wanted ? String(wanted.move_in).slice(0, 10) : life.moveIn || null,
    roomType: wanted ? String(wanted.room_pref) : life.roomType || "",
    gender: profile.gender || life.gender || "",
    occupation: profile.occupation || "",
    smoking: wanted ? String(wanted.smoking) : life.smoking || "no",
    pets: wanted ? String(wanted.pets) : life.pets || "no",
    food: wanted ? String(wanted.food_pref) : life.food || "either",
    durationMonths: wanted ? Number(wanted.duration_months) : life.duration ? Number(life.duration) : null,
  };
}

export const myMatches = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return { prefsReady: false, items: [] as { score: number; reasons: { label: string; tone: string }[]; note: string; id: string; title: string; cityName: string; localityName: string; monthlyRent: number; coverImage: string; roomType: string; isDemo: boolean }[] };
    const wantedRows = await sql<Record<string, unknown>>`
      select * from room_wanted where owner_id = ${context.userId} and status = 'active' order by created_at desc limit 1`;
    const prefs = prefsFrom(profile, wantedRows[0]);
    const rows = await sql<Record<string, unknown>>`
      select l.id, l.title, l.city_id as "cityId", c.name as "cityName", loc.name as "localityName",
        l.monthly_rent as "monthlyRent", l.available_from::text as "availableFrom", l.room_type as "roomType",
        l.gender_pref as "genderPref", l.occupant_pref as "occupantPref", l.smoking_allowed as "smokingAllowed",
        l.pets_allowed as "petsAllowed", l.food_available as "foodAvailable", l.min_stay_months as "minStay",
        l.cover_image as "coverImage", l.is_demo as "isDemo"
      from listings l
      join cities c on c.id = l.city_id
      join localities loc on loc.id = l.locality_id
      left join profiles p on p.user_id = l.owner_id
      where l.status = 'active' and l.owner_id <> ${context.userId} and coalesce(p.suspended, false) = false
      order by l.featured desc, l.created_at desc
      limit 80`;
    const items = rows
      .map((row) => {
        const result = matchScore(
          {
            cityId: String(row.cityId),
            monthlyRent: Number(row.monthlyRent),
            availableFrom: String(row.availableFrom),
            roomType: String(row.roomType),
            genderPref: String(row.genderPref),
            occupantPref: String(row.occupantPref),
            smokingAllowed: Boolean(row.smokingAllowed),
            petsAllowed: Boolean(row.petsAllowed),
            foodAvailable: Boolean(row.foodAvailable),
            minStayMonths: Number(row.minStay),
          },
          prefs,
        );
        return {
          ...result,
          id: String(row.id),
          title: String(row.title),
          cityName: String(row.cityName),
          localityName: String(row.localityName),
          monthlyRent: Number(row.monthlyRent),
          coverImage: String(row.coverImage),
          roomType: String(row.roomType),
          isDemo: Boolean(row.isDemo),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    return { prefsReady: Boolean(wantedRows[0] || profile.cityId), items };
  });

export const matchForListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return null;
    const wantedRows = await sql<Record<string, unknown>>`
      select * from room_wanted where owner_id = ${context.userId} and status = 'active' order by created_at desc limit 1`;
    const rows = await sql<Record<string, unknown>>`
      select city_id as "cityId", monthly_rent as "monthlyRent", available_from::text as "availableFrom",
        room_type as "roomType", gender_pref as "genderPref", occupant_pref as "occupantPref",
        smoking_allowed as "smokingAllowed", pets_allowed as "petsAllowed", food_available as "foodAvailable",
        min_stay_months as "minStay"
      from listings where id = ${id}`;
    if (!rows[0]) return null;
    const row = rows[0];
    return matchScore(
      {
        cityId: String(row.cityId),
        monthlyRent: Number(row.monthlyRent),
        availableFrom: String(row.availableFrom),
        roomType: String(row.roomType),
        genderPref: String(row.genderPref),
        occupantPref: String(row.occupantPref),
        smokingAllowed: Boolean(row.smokingAllowed),
        petsAllowed: Boolean(row.petsAllowed),
        foodAvailable: Boolean(row.foodAvailable),
        minStayMonths: Number(row.minStay),
      },
      prefsFrom(profile, wantedRows[0]),
    );
  });

export const saveRoomWanted = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const move = str(o.moveIn, 10);
    return {
      id: str(o.id, 80),
      name: str(o.name, 80),
      age: o.age == null || o.age === "" ? null : num(o.age),
      gender: str(o.gender, 20),
      occupation: str(o.occupation, 80),
      cityId: str(o.cityId, 40),
      localities: str(o.localities, 160),
      budget: Math.min(500000, Math.max(1000, num(o.budget))),
      moveIn: /^\d{4}-\d{2}-\d{2}$/.test(move) ? move : new Date().toISOString().slice(0, 10),
      durationMonths: Math.min(36, Math.max(1, num(o.durationMonths, 6))),
      roomPref: str(o.roomPref, 20) || "private",
      furnished: str(o.furnished, 20) || "semi",
      foodPref: str(o.foodPref, 20) || "either",
      smoking: str(o.smoking, 20) || "no",
      pets: str(o.pets, 20) || "no",
      roommateGender: str(o.roommateGender, 20) || "any",
      people: Math.min(6, Math.max(1, num(o.people, 1))),
      bio: str(o.bio, 800),
      lifestyle: str(o.lifestyle, 300),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile || profile.suspended) throw new Error("Profile is not available.");
    if (!data.cityId || !data.name) throw new Error("Name and city are required.");
    const id = data.id || crypto.randomUUID();
    if (data.id) {
      await sql`update room_wanted set name = ${data.name}, age = ${data.age}, gender = ${data.gender}, occupation = ${data.occupation},
        city_id = ${data.cityId}, localities = ${data.localities}, budget = ${data.budget}, move_in = ${data.moveIn},
        duration_months = ${data.durationMonths}, room_pref = ${data.roomPref}, furnished = ${data.furnished},
        food_pref = ${data.foodPref}, smoking = ${data.smoking}, pets = ${data.pets}, roommate_gender = ${data.roommateGender},
        people = ${data.people}, bio = ${data.bio}, lifestyle = ${data.lifestyle}, updated_at = now()
        where id = ${id} and owner_id = ${context.userId}`;
    } else {
      await sql`insert into room_wanted (id, owner_id, is_demo, name, age, gender, occupation, city_id, localities, budget, move_in, duration_months, room_pref, furnished, food_pref, smoking, pets, roommate_gender, people, bio, lifestyle)
        values (${id}, ${context.userId}, false, ${data.name}, ${data.age}, ${data.gender}, ${data.occupation}, ${data.cityId}, ${data.localities}, ${data.budget}, ${data.moveIn}, ${data.durationMonths}, ${data.roomPref}, ${data.furnished}, ${data.foodPref}, ${data.smoking}, ${data.pets}, ${data.roommateGender}, ${data.people}, ${data.bio}, ${data.lifestyle})`;
    }
    return { id };
  });

export const myRoomWanted = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const raw = await sql<Record<string, unknown>>`
      select id, name, city_id as "cityId", budget, move_in::text as "moveIn", status, bio, room_pref as "roomPref"
      from room_wanted where owner_id = ${context.userId} order by created_at desc`;
    return rowsOf<{ id: string; name: string; cityId: string; budget: number; moveIn: string; status: string; bio: string; roomPref: string }>(raw);
  });

export const closeRoomWanted = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`update room_wanted set status = 'closed', updated_at = now() where id = ${id} and owner_id = ${context.userId}`;
    return { ok: true };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const raw = await sql<Record<string, unknown>>`
      select c.id, c.listing_id as "listingId", l.title as "listingTitle",
        other.full_name as "otherName", other.is_demo as "otherDemo",
        (select body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as "lastBody",
        (select count(*) from messages m where m.conversation_id = c.id and m.sender_id <> ${context.userId}
          and m.created_at > coalesce(cm.last_read_at, '1970-01-01')) as unread
      from conversation_members cm
      join conversations c on c.id = cm.conversation_id
      left join listings l on l.id = c.listing_id
      left join lateral (
        select p.full_name, p.is_demo from conversation_members o
        join profiles p on p.user_id = o.user_id
        where o.conversation_id = c.id and o.user_id <> ${context.userId}
        limit 1
      ) other on true
      where cm.user_id = ${context.userId}
      order by c.updated_at desc
    `;
    return rowsOf<{
      id: string;
      listingId: string;
      listingTitle: string;
      otherName: string;
      otherDemo: boolean;
      lastBody: string;
      unread: number;
    }>(raw);
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const member = await sql`select 1 as ok from conversation_members where conversation_id = ${id} and user_id = ${context.userId}`;
    if (!member[0]) throw new Error("Conversation not found.");
    await sql`update conversation_members set last_read_at = now() where conversation_id = ${id} and user_id = ${context.userId}`;
    const messages = await sql<{ id: string; senderId: string; body: string; createdAt: string }>`
      select id, sender_id as "senderId", body, created_at::text as "createdAt"
      from messages where conversation_id = ${id} order by created_at asc`;
    return messages;
  });

export const startConversation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { listingId: str(o.listingId, 80), body: str(o.body, 2000) };
  })
  .handler(async ({ context, data }) => {
    if (!data.body) throw new Error("Write a message first.");
    const sql = await getSql();
    const listing = await sql<{ owner_id: string; title: string }>`
      select owner_id, title from listings where id = ${data.listingId} and status = 'active'`;
    if (!listing[0]) throw new Error("Listing is not open.");
    if (listing[0].owner_id === context.userId) throw new Error("This is your listing.");
    const blocked = await sql`select 1 as ok from blocks
      where (user_id = ${context.userId} and blocked_id = ${listing[0].owner_id})
         or (user_id = ${listing[0].owner_id} and blocked_id = ${context.userId})`;
    if (blocked[0]) throw new Error("Messaging is blocked.");
    const existing = await sql<{ id: string }>`
      select c.id from conversations c
      join conversation_members a on a.conversation_id = c.id and a.user_id = ${context.userId}
      join conversation_members b on b.conversation_id = c.id and b.user_id = ${listing[0].owner_id}
      where c.listing_id = ${data.listingId} limit 1`;
    const id = existing[0]?.id ?? crypto.randomUUID();
    if (!existing[0]) {
      await sql`insert into conversations (id, listing_id) values (${id}, ${data.listingId})`;
      await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${context.userId})`;
      await sql`insert into conversation_members (conversation_id, user_id) values (${id}, ${listing[0].owner_id})`;
    }
    await sql`insert into messages (id, conversation_id, sender_id, body) values (${crypto.randomUUID()}, ${id}, ${context.userId}, ${data.body})`;
    await sql`update conversations set updated_at = now() where id = ${id}`;
    if (!listing[0].owner_id.startsWith("demo:")) {
      await sql`insert into notifications (id, user_id, kind, title, body, href)
        values (${crypto.randomUUID()}, ${listing[0].owner_id}, 'message', 'New message', ${listing[0].title}, ${`/messages/${id}`})`;
    }
    return { id, demoHost: listing[0].owner_id.startsWith("demo:") };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { conversationId: str(o.conversationId, 80), body: str(o.body, 2000) };
  })
  .handler(async ({ context, data }) => {
    if (!data.body) throw new Error("Write a message first.");
    const sql = await getSql();
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members where conversation_id = ${data.conversationId}`;
    if (!member.some((row) => row.user_id === context.userId)) throw new Error("Conversation not found.");
    const other = member.find((row) => row.user_id !== context.userId)?.user_id;
    if (other) {
      const blocked = await sql`select 1 as ok from blocks
        where (user_id = ${context.userId} and blocked_id = ${other})
           or (user_id = ${other} and blocked_id = ${context.userId})`;
      if (blocked[0]) throw new Error("Messaging is blocked.");
    }
    await sql`insert into messages (id, conversation_id, sender_id, body)
      values (${crypto.randomUUID()}, ${data.conversationId}, ${context.userId}, ${data.body})`;
    await sql`update conversations set updated_at = now() where id = ${data.conversationId}`;
    if (other && !other.startsWith("demo:")) {
      await sql`insert into notifications (id, user_id, kind, title, href)
        values (${crypto.randomUUID()}, ${other}, 'message', 'New message', ${`/messages/${data.conversationId}`})`;
    }
    return { ok: true };
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: blockedId }) => {
    if (!blockedId || blockedId === context.userId) throw new Error("Cannot block that account.");
    const sql = await getSql();
    await sql`insert into blocks (user_id, blocked_id) values (${context.userId}, ${blockedId}) on conflict do nothing`;
    return { ok: true };
  });

export const fileReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const category = str(o.category, 40);
    const allowed = ["scam", "fake", "wrong", "harassment", "unsafe", "illegal", "duplicate", "other"];
    if (!allowed.includes(category)) throw new Error("Choose a report reason.");
    return {
      targetType: str(o.targetType, 20) === "user" ? "user" : "listing",
      targetId: str(o.targetId, 80),
      category,
      details: str(o.details, 800),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`insert into reports (id, reporter_id, target_type, target_id, category, details)
      values (${crypto.randomUUID()}, ${context.userId}, ${data.targetType}, ${data.targetId}, ${data.category}, ${data.details})`;
    if (data.targetType === "listing") {
      const count = await sql<{ n: number }>`select count(*) as n from reports where target_type = 'listing' and target_id = ${data.targetId} and status = 'open'`;
      if (Number(count[0]?.n ?? 0) >= 3) {
        await sql`update listings set fraud_flag = true where id = ${data.targetId}`;
      }
    }
    return { ok: true };
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const kind = str(o.kind, 40);
    if (!["identity", "property", "phone", "email"].includes(kind)) throw new Error("Unknown check.");
    return { kind, notes: str(o.notes, 800), listingId: str(o.listingId, 80) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`insert into verification_requests (id, user_id, listing_id, kind, notes)
      values (${crypto.randomUUID()}, ${context.userId}, ${data.listingId || null}, ${data.kind}, ${data.notes})`;
    await sql`update profiles set verification_status = 'pending', updated_at = now()
      where user_id = ${context.userId} and verification_status in ('unverified', 'rejected')`;
    return { ok: true };
  });

export const myNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{ id: string; title: string; body: string; href: string; createdAt: string; readAt: string | null }>`
      select id, title, body, href, created_at::text as "createdAt", read_at::text as "readAt"
      from notifications where user_id = ${context.userId} order by created_at desc limit 20`;
  });

export const myOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    const listings = await sql<{ id: string; monthlyRent: number; status: string; views: number }>`
      select id, monthly_rent as "monthlyRent", status, views from listings
      where owner_id = ${context.userId} and status <> 'removed'`;
    const saved = await sql<{ n: number }>`select count(*) as n from saved_listings where user_id = ${context.userId}`;
    const unread = await sql<{ n: number }>`
      select count(*) as n from messages m
      join conversation_members cm on cm.conversation_id = m.conversation_id
      where cm.user_id = ${context.userId} and m.sender_id <> ${context.userId}
        and m.created_at > coalesce(cm.last_read_at, '1970-01-01')`;
    const wanted = await sql<{ n: number }>`select count(*) as n from room_wanted where owner_id = ${context.userId} and status = 'active'`;
    const checks = profile
      ? [profile.fullName, profile.occupation, profile.cityId, profile.about, profile.gender, profile.age ? "age" : ""].filter(Boolean).length
      : 0;
    return {
      profile,
      listingCount: listings.length,
      activeListings: listings.filter((row) => row.status === "active").length,
      listedRent: listings.filter((row) => row.status === "active").reduce((sum, row) => sum + Number(row.monthlyRent), 0),
      views: listings.reduce((sum, row) => sum + Number(row.views), 0),
      saved: Number(saved[0]?.n ?? 0),
      unread: Number(unread[0]?.n ?? 0),
      wanted: Number(wanted[0]?.n ?? 0),
      completion: Math.round((checks / 6) * 100),
    };
  });
