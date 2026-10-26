import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Badge, Button, Empty, Panel } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { confirmCheckout, createCheckout, myListings, myPayments } from "@/lib/roomsetu/account-api";
import { inr } from "@/lib/roomsetu/catalog";
import { PLANS, planById, type PlanId } from "@/lib/roomsetu/payments";

type BillingSearch = { plan?: string; listing?: string };

export const Route = createFileRoute("/billing")({
  validateSearch: (search: Record<string, unknown>): BillingSearch => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
    listing: typeof search.listing === "string" ? search.listing : undefined,
  }),
  component: BillingPage,
});

function loadRazorpay() {
  const existing = (window as Window & { Razorpay?: unknown }).Razorpay;
  if (existing) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function BillingPage() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [plan, setPlan] = useState<PlanId>(planById(search.plan ?? "")?.id ?? "boost");
  const [listingId, setListingId] = useState(search.listing ?? "");
  const [listings, setListings] = useState<Awaited<ReturnType<typeof myListings>>>([]);
  const [payments, setPayments] = useState<Awaited<ReturnType<typeof myPayments>>>([]);
  const [busy, setBusy] = useState(false);
  const chosen = planById(plan) ?? PLANS[0];

  function reload() {
    void myListings().then((rows) => {
      setListings(rows);
      setListingId((current) => current || rows[0]?.id || "");
    }).catch(() => undefined);
    void myPayments().then(setPayments).catch(() => undefined);
  }

  useEffect(() => {
    if (!user) return;
    reload();
  }, [user]);

  async function pay() {
    if (!user) return;
    setBusy(true);
    try {
      const order = await createCheckout({
        data: { purpose: chosen.id, referenceId: chosen.needsListing ? listingId : "" },
      });
      if (!order.configured || !order.keyId || !order.orderId) {
        toast.message("Razorpay keys are not on this server yet. Nothing was charged.");
        return;
      }
      await loadRazorpay();
      const Razorpay = (window as unknown as {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
      }).Razorpay;
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "RoomSetu",
        description: order.description,
        order_id: order.orderId,
        prefill: { name: order.prefillName, email: order.prefillEmail },
        theme: { color: "#0e6b56" },
        handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          void confirmCheckout({
            data: {
              paymentId: order.paymentId,
              orderId: response.razorpay_order_id,
              providerPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
          })
            .then(() => {
              toast.success("Payment captured.");
              reload();
            })
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not confirm the payment."));
        },
      });
      checkout.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Billing</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Pay RoomSetu for a boost or a seeker pass. Monthly rent is still paid to the host. A charge is marked paid only after Razorpay captures it.
      </p>
      {isPending ? <div className="mt-6 h-28 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? (
        <p className="mt-6 text-sm">
          <Link to="/login" className="text-primary">Sign in</Link> to pay for a boost.
        </p>
      ) : null}
      {user ? (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {PLANS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlan(item.id)}
                className={`rounded-xl border p-4 text-left ${plan === item.id ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
              >
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 font-display text-3xl tabular-nums">{inr(item.amountInr)}</p>
                <p className="mt-2 text-sm text-muted">{item.blurb}</p>
              </button>
            ))}
          </div>
          <Panel className="mt-4">
            {chosen.needsListing ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Listing</span>
                <select
                  className="h-11 w-full rounded-md border border-line bg-surface px-3"
                  value={listingId}
                  onChange={(event) => setListingId(event.target.value)}
                >
                  {listings.length === 0 ? <option value="">No listing yet</option> : null}
                  {listings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm text-muted">The seeker pass sits on your profile. It does not unlock phone numbers.</p>
            )}
            <Button className="mt-4" type="button" disabled={busy || (chosen.needsListing && !listingId)} onClick={() => void pay()}>
              {busy ? "Opening Razorpay…" : `Pay ${inr(chosen.amountInr)} with Razorpay`}
            </Button>
            <p className="mt-2 text-xs text-faint">
              Checkout uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server. Without those keys, this button does not charge anything.
            </p>
          </Panel>
          <section className="mt-8">
            <h2 className="font-display text-3xl">Your charges</h2>
            <div className="mt-3 grid gap-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-3 text-sm">
                  <span>{planById(payment.purpose)?.label ?? payment.purpose}</span>
                  <span className="tabular-nums">{inr(payment.amountInr)}</span>
                  <Badge tone={payment.status === "captured" ? "good" : "neutral"}>{payment.status}</Badge>
                </div>
              ))}
              {payments.length === 0 ? <Empty title="No charges yet" body="A captured Razorpay payment will show up here." /> : null}
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
