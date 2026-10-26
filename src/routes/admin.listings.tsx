import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin-frame";
import { Badge, Button } from "@/components/ui";
import { adminListings, adminSetListing } from "@/lib/roomsetu/admin-api";
import { inr } from "@/lib/roomsetu/catalog";

export const Route = createFileRoute("/admin/listings")({
  loader: async () => {
    try {
      return { rows: await adminListings(), error: "" };
    } catch (error) {
      return { rows: [], error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: AdminListingsPage,
});

function AdminListingsPage() {
  const loaded = Route.useLoaderData();
  const [rows, setRows] = useState(loaded.rows);

  async function update(row: (typeof rows)[number], patch: { status?: string; verificationStatus?: string; featured?: boolean }) {
    try {
      await adminSetListing({
        data: {
          id: String(row.id),
          status: patch.status ?? String(row.status),
          verificationStatus: patch.verificationStatus ?? String(row.verificationStatus),
          featured: patch.featured ?? Boolean(row.featured),
        },
      });
      setRows(await adminListings());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  return (
    <AdminFrame>
      <h1 className="font-display text-4xl">Listings</h1>
      {loaded.error ? <p className="mt-2 text-sm">{loaded.error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={String(row.id)} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{String(row.status)}</Badge>
              <Badge>{String(row.verificationStatus)}</Badge>
              {row.isDemo ? <Badge tone="warn">Demo</Badge> : null}
              {row.fraudFlag ? <Badge tone="warn">Fraud flag</Badge> : null}
              {row.duplicateSuspect ? <Badge tone="warn">Possible duplicate</Badge> : null}
              {row.boostRequested ? <Badge>Boost requested</Badge> : null}
              {row.featured ? <Badge tone="good">Featured</Badge> : null}
            </div>
            <h2 className="mt-2 font-medium">{String(row.title)}</h2>
            <p className="text-sm text-muted">{String(row.hostName)} · {String(row.cityName)} · {inr(Number(row.monthlyRent))} · {String(row.plan)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/listing/$id" params={{ id: String(row.id) }} className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm">Open</Link>
              <Button type="button" variant="ghost" onClick={() => void update(row, { status: row.status === "removed" ? "active" : "removed" })}>Remove</Button>
              <Button type="button" variant="ghost" onClick={() => void update(row, { verificationStatus: row.verificationStatus === "verified" ? "rejected" : "verified" })}>
                {row.verificationStatus === "verified" ? "Unverify" : "Verify"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => void update(row, { featured: !row.featured })}>
                {row.featured ? "Unfeature" : "Feature"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
