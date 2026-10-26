import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { getSql, type Sql } from "@/lib/db";
import { planById, type PlanId } from "@/lib/roomsetu/payments";

export type CheckoutStart = {
  configured: boolean;
  paymentId: string;
  amountInr: number;
  amountPaise: number;
  currency: "INR";
  keyId: string;
  orderId: string;
  description: string;
  prefillName: string;
  prefillEmail: string;
};

function razorpayKeys() {
  const id = env("RAZORPAY_KEY_ID");
  const secret = env("RAZORPAY_KEY_SECRET");
  if (!id || !secret) return null;
  return { id, secret };
}

function basicAuth(id: string, secret: string) {
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function razorpay(path: string, init?: { method?: string; body?: unknown }) {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay is not configured.");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: basicAuth(keys.id, keys.secret),
      "content-type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: { description?: string };
  } | null;
  if (!response.ok) {
    const description = payload?.error?.description;
    throw new Error(description || "Razorpay refused that request.");
  }
  return payload as Record<string, unknown>;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function applyPlan(sql: Sql, userId: string, purpose: PlanId, referenceId: string, days: number) {
  if (purpose === "tenant_premium") {
    await sql`
      update profiles
      set premium_until = greatest(coalesce(premium_until, now()), now()) + (${days} * interval '1 day'),
          updated_at = now()
      where user_id = ${userId}`;
    return;
  }
  const updated = await sql<{ id: string }>`
    update listings
    set featured = true,
        featured_until = greatest(coalesce(featured_until, now()), now()) + (${days} * interval '1 day'),
        plan = ${purpose},
        boost_requested = false,
        updated_at = now()
    where id = ${referenceId} and owner_id = ${userId} and status <> 'removed'
    returning id`;
  if (!updated.length) throw new Error("That listing is not yours.");
}

async function markFulfilled(sql: Sql, paymentId: string, providerPaymentId: string) {
  return sql<{ id: string }>`
    update payments
    set status = 'captured', provider_payment_id = ${providerPaymentId}, fulfilled = true
    where id = ${paymentId} and fulfilled = false
    returning id`;
}

export async function startCheckout(userId: string, purpose: PlanId, referenceId: string): Promise<CheckoutStart> {
  const plan = planById(purpose);
  if (!plan) throw new Error("Unknown plan.");
  const sql = await getSql();
  const profile = await sql<{ full_name: string; email: string }>`
    select full_name, email from profiles where user_id = ${userId}`;
  if (plan.needsListing) {
    const owned = await sql<{ id: string }>`
      select id from listings
      where id = ${referenceId} and owner_id = ${userId} and status <> 'removed'`;
    if (!owned.length) throw new Error("Choose one of your own listings.");
  }
  const keys = razorpayKeys();
  const base = {
    configured: Boolean(keys),
    paymentId: "",
    amountInr: plan.amountInr,
    amountPaise: plan.amountInr * 100,
    currency: "INR" as const,
    keyId: keys?.id ?? "",
    orderId: "",
    description: plan.label,
    prefillName: profile[0]?.full_name ?? "",
    prefillEmail: profile[0]?.email ?? "",
  };
  if (!keys) return base;

  const paymentId = crypto.randomUUID();
  const order = await razorpay("/orders", {
    method: "POST",
    body: {
      amount: plan.amountInr * 100,
      currency: "INR",
      receipt: paymentId,
      notes: {
        paymentId,
        purpose,
        referenceId: plan.needsListing ? referenceId : userId,
        userId,
      },
    },
  });
  const orderId = String(order.id ?? "");
  if (!orderId) throw new Error("Razorpay did not return an order.");
  await sql`
    insert into payments (id, user_id, purpose, amount_inr, status, provider, reference_id, order_id)
    values (${paymentId}, ${userId}, ${purpose}, ${plan.amountInr}, 'created', 'razorpay', ${plan.needsListing ? referenceId : userId}, ${orderId})`;
  return { ...base, paymentId, orderId };
}

export async function confirmCheckout(
  userId: string,
  input: { paymentId: string; orderId: string; providerPaymentId: string; signature: string },
) {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay is not configured.");
  const expected = createHmac("sha256", keys.secret).update(`${input.orderId}|${input.providerPaymentId}`).digest("hex");
  if (!safeEqual(expected, input.signature)) throw new Error("Payment signature did not match.");

  const sql = await getSql();
  const rows = await sql<{
    id: string;
    purpose: string;
    reference_id: string;
    amount_inr: number;
    status: string;
    fulfilled: boolean;
  }>`
    select id, purpose, reference_id, amount_inr, status, fulfilled
    from payments
    where id = ${input.paymentId} and user_id = ${userId} and order_id = ${input.orderId}`;
  const payment = rows[0];
  if (!payment) throw new Error("That payment does not belong to you.");
  if (payment.fulfilled) return { ok: true as const, status: "captured" };

  const remote = await razorpay(`/payments/${encodeURIComponent(input.providerPaymentId)}`);
  if (String(remote.order_id ?? "") !== input.orderId) throw new Error("Order did not match the payment.");
  if (Number(remote.amount) !== payment.amount_inr * 100) throw new Error("Amount did not match.");
  let status = String(remote.status ?? "");
  if (status === "authorized") {
    const captured = await razorpay(`/payments/${encodeURIComponent(input.providerPaymentId)}/capture`, {
      method: "POST",
      body: { amount: payment.amount_inr * 100, currency: "INR" },
    });
    status = String(captured.status ?? status);
  }
  if (status !== "captured") throw new Error("Razorpay has not captured this payment.");

  const plan = planById(payment.purpose);
  if (!plan) throw new Error("Unknown plan on this payment.");
  const won = await markFulfilled(sql, payment.id, input.providerPaymentId);
  if (won.length) await applyPlan(sql, userId, plan.id, payment.reference_id, plan.days);
  return { ok: true as const, status: "captured" };
}

export async function handleRazorpayWebhook(raw: string, signature: string | null): Promise<Response> {
  const secret = env("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return new Response("Webhook secret is not set.", { status: 501 });
  if (!signature) return new Response("Missing signature.", { status: 400 });
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqual(expected, signature)) return new Response("Bad signature.", { status: 400 });

  const event = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number } } };
  };
  if (event.event !== "payment.captured") return Response.json({ ok: true, ignored: true });
  const entity = event.payload?.payment?.entity;
  if (!entity?.id || !entity.order_id) return new Response("Missing payment.", { status: 400 });

  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    purpose: string;
    reference_id: string;
    amount_inr: number;
    fulfilled: boolean;
  }>`
    select id, user_id, purpose, reference_id, amount_inr, fulfilled
    from payments where order_id = ${entity.order_id} and provider = 'razorpay'`;
  const payment = rows[0];
  if (!payment || payment.fulfilled) return Response.json({ ok: true });
  if (Number(entity.amount) !== payment.amount_inr * 100) return new Response("Amount mismatch.", { status: 400 });
  const plan = planById(payment.purpose);
  if (!plan) return new Response("Unknown plan.", { status: 400 });
  const won = await markFulfilled(sql, payment.id, entity.id);
  if (won.length) await applyPlan(sql, payment.user_id, plan.id, payment.reference_id, plan.days);
  return Response.json({ ok: true });
}
