import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { rowsOf } from "@/lib/roomsetu/plain";

function str(v: unknown, max = 200) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function requireAdmin(sql: Sql, userId: string) {
  const rows = await sql<{ role: string }>`select role from profiles where user_id = ${userId}`;
  const role = rows[0]?.role ?? "";
  if (role !== "admin" && role !== "super_admin") throw new Error("Forbidden");
  return role;
}

async function audit(sql: Sql, actor: string, action: string, target: string) {
  await sql`insert into audit_log (id, actor_id, action, target) values (${crypto.randomUUID()}, ${actor}, ${action}, ${target})`;
}

const DEFAULT_WIDGETS = [
  { id: "kpis", position: 1, visible: true, size: "lg" },
  { id: "growth", position: 2, visible: true, size: "lg" },
  { id: "cities", position: 3, visible: true, size: "md" },
  { id: "funnel", position: 4, visible: true, size: "md" },
  { id: "trust", position: 5, visible: true, size: "md" },
  { id: "revenue", position: 6, visible: true, size: "md" },
];

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const [kpis] = await sql<Record<string, number>>`
      select
        (select count(*) from profiles) as users,
        (select count(*) from profiles where is_demo = false) as live_users,
        (select count(*) from profiles where created_at > now() - interval '7 days') as new_users,
        (select count(*) from profiles where last_seen_at > now() - interval '7 days') as active_users,
        (select count(*) from listings where status <> 'removed') as listings,
        (select count(*) from listings where status = 'active') as active_listings,
        (select count(*) from listings where status = 'occupied') as occupied,
        (select count(*) from room_wanted where status = 'active') as wanted,
        (select count(*) from profiles where verification_status = 'verified') as verified_hosts,
        (select count(*) from verification_requests where status = 'pending') as pending_verification,
        (select count(*) from conversations) as conversations,
        (select count(*) from applications) as applications,
        (select count(*) from applications where status = 'accepted') as accepted,
        (select count(*) from recorded_matches) as matches,
        (select count(*) from reports where status = 'open') as open_reports,
        (select count(*) from profiles where suspended = true) as suspensions,
        (select count(*) from listings where fraud_flag = true) as fraud_flags,
        (select coalesce(round(avg(monthly_rent)), 0) from listings where status = 'active') as avg_rent,
        (select coalesce(round(avg(deposit)), 0) from listings where status = 'active') as avg_deposit,
        (select coalesce(sum(l.monthly_rent), 0) from applications a join listings l on l.id = a.listing_id where a.status = 'accepted') as agreed_rent,
        (select count(*) from listings where plan <> 'free') as paid_listings,
        (select coalesce(sum(amount_inr), 0) from payments where status = 'captured') as captured_inr,
        (select count(*) from payments where status = 'captured') as captured_count,
        (select count(*) from search_events) as searches,
        (select count(*) from properties) as properties,
        (select count(*) from profiles where user_type in ('offering', 'both') or user_id like 'demo:h%') as hosts,
        (select count(*) from profiles where user_type in ('looking', 'both') or user_id like 'demo:s%') as seekers
    `;
    const listingWeeks = await sql<{ week: string; listings: number; sort: string }>`
      select to_char(date_trunc('week', created_at), 'DD Mon') as week,
        count(*) as listings,
        to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as sort
      from listings
      group by date_trunc('week', created_at)
      order by date_trunc('week', created_at)
    `;
    const userWeeks = await sql<{ week: string; users: number }>`
      select to_char(date_trunc('week', created_at), 'DD Mon') as week, count(*) as users
      from profiles
      group by date_trunc('week', created_at)
    `;
    const usersByWeek = new Map(userWeeks.map((row) => [row.week, Number(row.users)]));
    const growth = listingWeeks.map((row) => ({
      week: row.week,
      listings: Number(row.listings),
      users: usersByWeek.get(row.week) ?? 0,
    }));
    const cities = await sql<{ name: string; rooms: number }>`
      select c.name, count(l.id) as rooms
      from cities c left join listings l on l.city_id = c.id and l.status = 'active'
      group by c.name order by rooms desc, c.name limit 12
    `;
    const layoutRow = await sql<{ widgets: unknown }>`select widgets from dashboard_layouts where user_id = ${context.userId}`;
    const widgets = Array.isArray(layoutRow[0]?.widgets) ? layoutRow[0]?.widgets : DEFAULT_WIDGETS;
    const users = Number(kpis?.users ?? 0);
    const applications = Number(kpis?.applications ?? 0);
    const accepted = Number(kpis?.accepted ?? 0);
    const conversations = Number(kpis?.conversations ?? 0);
    const activeListings = Number(kpis?.active_listings ?? 0);
    return {
      kpis,
      growth,
      cities,
      widgets,
      rates: {
        conversion: applications ? Math.round((accepted / applications) * 100) : 0,
        enquiry: activeListings ? Math.round((conversations / activeListings) * 100) : 0,
        match: Number(kpis?.wanted ?? 0) ? Math.round((Number(kpis?.matches ?? 0) / Number(kpis?.wanted ?? 1)) * 100) : 0,
      },
      note: users ? "Counts include clearly marked demo rows plus anyone who has signed in." : "",
    };
  });

export const saveDashboardLayout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!Array.isArray(input)) throw new Error("Layout is invalid.");
    return input
      .map((item, index) => {
        const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          id: str(o.id, 40),
          position: index + 1,
          visible: o.visible !== false,
          size: str(o.size, 8) === "lg" ? "lg" : "md",
        };
      })
      .filter((item) => item.id);
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    await sql`insert into dashboard_layouts (user_id, widgets) values (${context.userId}, ${JSON.stringify(data)}::jsonb)
      on conflict (user_id) do update set widgets = excluded.widgets`;
    return { ok: true };
  });

export const adminUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const raw = await sql<Record<string, unknown>>`
      select user_id as "userId", full_name as "fullName", email, city_id as "cityId", occupation,
        role, verification_status as "verificationStatus", suspended, is_demo as "isDemo", user_type as "userType",
        created_at::text as "createdAt"
      from profiles order by is_demo asc, created_at desc limit 200`;
    return rowsOf<{
      userId: string;
      fullName: string;
      email: string;
      cityId: string;
      occupation: string;
      role: string;
      verificationStatus: string;
      suspended: boolean;
      isDemo: boolean;
      userType: string;
      createdAt: string;
    }>(raw);
  });

export const adminSetUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return {
      userId: str(o.userId, 80),
      role: str(o.role, 20),
      suspended: Boolean(o.suspended),
      verificationStatus: str(o.verificationStatus, 20),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const role = await requireAdmin(sql, context.userId);
    if (data.userId === context.userId && data.suspended) throw new Error("You cannot suspend yourself.");
    const nextRole = ["member", "admin", "super_admin"].includes(data.role) ? data.role : "member";
    if (nextRole === "super_admin" && role !== "super_admin") throw new Error("Only a super admin can grant that role.");
    const verification = ["unverified", "pending", "verified", "rejected", "suspended"].includes(data.verificationStatus)
      ? data.verificationStatus
      : "unverified";
    await sql`update profiles set role = ${nextRole}, suspended = ${data.suspended}, verification_status = ${verification}, updated_at = now()
      where user_id = ${data.userId}`;
    if (data.suspended) {
      await sql`update listings set status = 'paused', updated_at = now() where owner_id = ${data.userId} and status = 'active'`;
    }
    await audit(sql, context.userId, "user.update", data.userId);
    return { ok: true };
  });

export const adminListings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const raw = await sql<Record<string, unknown>>`
      select l.id, l.title, l.status, l.monthly_rent as "monthlyRent", l.verification_status as "verificationStatus",
        l.featured, l.plan, l.is_demo as "isDemo", l.fraud_flag as "fraudFlag", l.duplicate_suspect as "duplicateSuspect",
        l.boost_requested as "boostRequested", c.name as "cityName", p.full_name as "hostName"
      from listings l
      join cities c on c.id = l.city_id
      left join profiles p on p.user_id = l.owner_id
      order by l.fraud_flag desc, l.created_at desc limit 200`;
    return rowsOf<{
      id: string;
      title: string;
      status: string;
      monthlyRent: number;
      verificationStatus: string;
      featured: boolean;
      plan: string;
      isDemo: boolean;
      fraudFlag: boolean;
      duplicateSuspect: boolean;
      boostRequested: boolean;
      cityName: string;
      hostName: string;
    }>(raw);
  });

export const adminSetListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return {
      id: str(o.id, 80),
      status: str(o.status, 20),
      verificationStatus: str(o.verificationStatus, 20),
      featured: Boolean(o.featured),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const status = ["active", "paused", "occupied", "removed"].includes(data.status) ? data.status : "active";
    const verification = ["unverified", "pending", "verified", "rejected", "suspended"].includes(data.verificationStatus)
      ? data.verificationStatus
      : "unverified";
    await sql`update listings set status = ${status}, verification_status = ${verification}, featured = ${data.featured},
      plan = case when ${data.featured} then 'featured' else plan end, updated_at = now()
      where id = ${data.id}`;
    await audit(sql, context.userId, "listing.update", data.id);
    return { ok: true };
  });

export const adminVerifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const raw = await sql<Record<string, unknown>>`
      select v.id, v.kind, v.status, v.notes, v.created_at::text as "createdAt", v.listing_id as "listingId",
        p.full_name as "name", p.user_id as "userId", p.is_demo as "isDemo"
      from verification_requests v join profiles p on p.user_id = v.user_id
      order by v.status = 'pending' desc, v.created_at desc limit 100`;
    return rowsOf<{ id: string; kind: string; status: string; notes: string; createdAt: string; listingId: string; name: string; userId: string; isDemo: boolean }>(raw);
  });

export const adminDecideVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const status = str(o.status, 20);
    if (!["verified", "rejected"].includes(status)) throw new Error("Choose approve or reject.");
    return { id: str(o.id, 80), status };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql<{ user_id: string; listing_id: string | null; kind: string }>`
      select user_id, listing_id, kind from verification_requests where id = ${data.id}`;
    if (!rows[0]) throw new Error("Request not found.");
    await sql`update verification_requests set status = ${data.status}, updated_at = now() where id = ${data.id}`;
    if (data.status === "verified") {
      if (rows[0].kind === "phone") await sql`update profiles set phone_verified = true, updated_at = now() where user_id = ${rows[0].user_id}`;
      else if (rows[0].kind === "email") await sql`update profiles set email_verified = true, updated_at = now() where user_id = ${rows[0].user_id}`;
      else await sql`update profiles set verification_status = 'verified', updated_at = now() where user_id = ${rows[0].user_id}`;
      if (rows[0].listing_id) {
        await sql`update listings set verification_status = 'verified', updated_at = now() where id = ${rows[0].listing_id}`;
      }
    } else if (rows[0].kind === "identity" || rows[0].kind === "property") {
      await sql`update profiles set verification_status = 'rejected', updated_at = now() where user_id = ${rows[0].user_id}`;
    }
    if (!rows[0].user_id.startsWith("demo:")) {
      await sql`insert into notifications (id, user_id, kind, title, href) values
        (${crypto.randomUUID()}, ${rows[0].user_id}, 'verification', ${data.status === "verified" ? "Verification approved" : "Verification needs another look"}, '/verification')`;
    }
    await audit(sql, context.userId, `verification.${data.status}`, data.id);
    return { ok: true };
  });

export const adminReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const raw = await sql<Record<string, unknown>>`
      select id, reporter_id as "reporterId", target_type as "targetType", target_id as "targetId",
        category, details, status, created_at::text as "createdAt"
      from reports order by status = 'open' desc, created_at desc limit 100`;
    return rowsOf<{ id: string; reporterId: string; targetType: string; targetId: string; category: string; details: string; status: string; createdAt: string }>(raw);
  });

export const adminCloseReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => str(id, 80))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    await sql`update reports set status = 'closed' where id = ${id}`;
    await audit(sql, context.userId, "report.close", id);
    return { ok: true };
  });

export const adminAddPlace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return {
      kind: str(o.kind, 20),
      id: str(o.id, 40).toLowerCase(),
      name: str(o.name, 80),
      state: str(o.state, 80),
      cityId: str(o.cityId, 40),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    if (!/^[a-z0-9:-]{2,40}$/.test(data.id) || !data.name) throw new Error("Use a short id and a name.");
    if (data.kind === "city") {
      await sql`insert into cities (id, name, state, sort_order) values (${data.id}, ${data.name}, ${data.state || "India"}, 100)`;
    } else {
      if (!data.cityId) throw new Error("Choose a city.");
      await sql`insert into localities (id, city_id, name) values (${`${data.cityId}:${data.id}`}, ${data.cityId}, ${data.name})`;
    }
    await audit(sql, context.userId, "place.add", data.id);
    return { ok: true };
  });

export const adminAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return sql<{ id: string; actorId: string; action: string; target: string; createdAt: string }>`
      select id, actor_id as "actorId", action, target, created_at::text as "createdAt"
      from audit_log order by created_at desc limit 40`;
  });

export const adminConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const raw = await sql<Record<string, unknown>>`
      select c.id, c.listing_id as "listingId", c.created_at::text as "createdAt",
        (select count(*) from messages m where m.conversation_id = c.id) as messages
      from conversations c order by c.updated_at desc limit 40`;
    return rowsOf<{ id: string; listingId: string; createdAt: string; messages: number }>(raw);
  });
