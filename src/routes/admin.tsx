import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin-frame";
import { Button } from "@/components/ui";
import { adminDashboard, saveDashboardLayout } from "@/lib/roomsetu/admin-api";
import { inr } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    try {
      return { data: await adminDashboard(), error: "" };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: AdminHome,
});

type Widget = { id: string; position: number; visible: boolean; size: string };

function AdminHome() {
  const loaded = Route.useLoaderData();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [drag, setDrag] = useState("");
  const [chart, setChart] = useState(false);

  useEffect(() => setChart(true), []);
  useEffect(() => {
    const raw = loaded.data?.widgets;
    if (Array.isArray(raw)) setWidgets(raw as Widget[]);
  }, [loaded.data]);

  if (!loaded.data) {
    return (
      <AdminFrame>
        <h1 className="font-display text-4xl">Admin</h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          {loaded.error === "Unauthorized"
            ? "Sign in first. The first member to create a profile becomes super admin."
            : "This desk is for admin and super admin roles. Sign in with the first account on a fresh marketplace, or ask a super admin to grant access."}
        </p>
      </AdminFrame>
    );
  }

  const k = loaded.data.kpis;
  const cards: Record<string, { title: string; body: ReactNode }> = {
    kpis: {
      title: "Marketplace",
      body: (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Users", k.users],
            ["Live accounts", k.live_users],
            ["New, 7 days", k.new_users],
            ["Active, 7 days", k.active_users],
            ["Listings", k.listings],
            ["Active rooms", k.active_listings],
            ["Occupied", k.occupied],
            ["Room wanted", k.wanted],
            ["Properties", k.properties],
            ["Hosts", k.hosts],
            ["Seekers", k.seekers],
            ["Searches", k.searches],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-display text-2xl tabular-nums">{Number(value)}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    growth: {
      title: "Growth by week",
      body: chart ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loaded.data.growth}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} width={28} />
              <Tooltip />
              <Bar dataKey="listings" fill="var(--color-primary)" radius={4} />
              <Bar dataKey="users" fill="var(--color-ink)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted">{loaded.data.growth.length} weeks of signups and listings.</p>
      ),
    },
    cities: {
      title: "Rooms by city",
      body: (
        <ul className="space-y-1 text-sm">
          {loaded.data.cities.map((city) => (
            <li key={city.name} className="flex justify-between gap-3">
              <span>{city.name}</span>
              <span className="tabular-nums">{city.rooms}</span>
            </li>
          ))}
        </ul>
      ),
    },
    funnel: {
      title: "Flywheel",
      body: (
        <ul className="space-y-1 text-sm">
          <li>Enquiry rate {loaded.data.rates.enquiry}% of active listings have a thread</li>
          <li>Application conversion {loaded.data.rates.conversion}%</li>
          <li>Recorded matches vs room-wanted {loaded.data.rates.match}%</li>
          <li>Conversations {Number(k.conversations)} · applications {Number(k.applications)} · accepted {Number(k.accepted)}</li>
        </ul>
      ),
    },
    trust: {
      title: "Trust",
      body: (
        <ul className="space-y-1 text-sm">
          <li>Verified profiles {Number(k.verified_hosts)}</li>
          <li>Pending checks {Number(k.pending_verification)}</li>
          <li>Open reports {Number(k.open_reports)}</li>
          <li>Fraud flags {Number(k.fraud_flags)}</li>
          <li>Suspensions {Number(k.suspensions)}</li>
        </ul>
      ),
    },
    revenue: {
      title: "Money",
      body: (
        <div className="text-sm">
          <p>Average rent {inr(Number(k.avg_rent))}</p>
          <p>Average deposit {inr(Number(k.avg_deposit))}</p>
          <p>Agreed rent on accepted applications {inr(Number(k.agreed_rent))}</p>
          <p>Paid or featured plans {Number(k.paid_listings)}</p>
          <p>Captured on Razorpay {inr(Number(k.captured_inr ?? 0))} · {Number(k.captured_count ?? 0)} charges</p>
          <p className="mt-2 text-xs text-faint">Only captured Razorpay charges count. Asking rent is not platform revenue.</p>
        </div>
      ),
    },
  };

  function dropOn(id: string) {
    if (!drag || drag === id) return;
    const next = [...widgets];
    const from = next.findIndex((item) => item.id === drag);
    const to = next.findIndex((item) => item.id === id);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setWidgets(next.map((widget, index) => ({ ...widget, position: index + 1 })));
    setDrag("");
  }

  return (
    <AdminFrame>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Overview</h1>
          <p className="mt-1 text-sm text-muted">Drag a card onto another to reorder. Hide any you do not need.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void saveDashboardLayout({ data: widgets }).then(() => toast.success("Layout saved")).catch((error) => toast.error(error instanceof Error ? error.message : "Could not save"))}
        >
          Save layout
        </Button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {widgets.map((widget) => {
          const card = cards[widget.id];
          if (!card) return null;
          return (
            <section
              key={widget.id}
              draggable
              onDragStart={() => setDrag(widget.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(widget.id)}
              className={`rounded-xl border border-line bg-surface p-4 ${widget.visible ? "" : "opacity-50"} ${widget.size === "lg" ? "lg:col-span-2" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-medium">{card.title}</h2>
                <div className="flex gap-2">
                  <button type="button" className="text-xs text-muted" onClick={() => setWidgets(widgets.map((item) => item.id === widget.id ? { ...item, size: item.size === "lg" ? "md" : "lg" } : item))}>
                    {widget.size === "lg" ? "Shrink" : "Widen"}
                  </button>
                  <button type="button" className="text-xs text-muted" onClick={() => setWidgets(widgets.map((item) => item.id === widget.id ? { ...item, visible: !item.visible } : item))}>
                    {widget.visible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {widget.visible ? card.body : <p className="text-sm text-faint">Hidden on your layout.</p>}
            </section>
          );
        })}
      </div>
    </AdminFrame>
  );
}
