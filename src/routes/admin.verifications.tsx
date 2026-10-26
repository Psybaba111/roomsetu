import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin-frame";
import { Badge, Button } from "@/components/ui";
import { adminDecideVerification, adminVerifications } from "@/lib/roomsetu/admin-api";

export const Route = createFileRoute("/admin/verifications")({
  loader: async () => {
    try {
      return { rows: await adminVerifications(), error: "" };
    } catch (error) {
      return { rows: [], error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: VerificationsPage,
});

function VerificationsPage() {
  const loaded = Route.useLoaderData();
  const [rows, setRows] = useState(loaded.rows);
  return (
    <AdminFrame>
      <h1 className="font-display text-4xl">Verification queue</h1>
      <p className="mt-1 text-sm text-muted">Approving identity or property sets the profile to verified. Phone and email only flip their own flags.</p>
      {loaded.error ? <p className="mt-2 text-sm">{loaded.error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={String(row.id)} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex gap-2">
              <Badge>{String(row.status)}</Badge>
              <Badge>{String(row.kind)}</Badge>
              {row.isDemo ? <Badge tone="warn">Demo</Badge> : null}
            </div>
            <h2 className="mt-2 font-medium">{String(row.name)}</h2>
            <p className="text-sm text-muted">{String(row.notes)}</p>
            {row.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => void adminDecideVerification({ data: { id: String(row.id), status: "verified" } }).then(async () => setRows(await adminVerifications())).catch((error) => toast.error(error instanceof Error ? error.message : "Failed"))}>Approve</Button>
                <Button type="button" variant="ghost" onClick={() => void adminDecideVerification({ data: { id: String(row.id), status: "rejected" } }).then(async () => setRows(await adminVerifications()))}>Reject</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
