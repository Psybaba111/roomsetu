import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminFrame } from "@/components/admin-frame";
import { Badge, Button } from "@/components/ui";
import { adminCloseReport, adminReports } from "@/lib/roomsetu/admin-api";

export const Route = createFileRoute("/admin/reports")({
  loader: async () => {
    try {
      return { rows: await adminReports(), error: "" };
    } catch (error) {
      return { rows: [], error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: ReportsPage,
});

function ReportsPage() {
  const loaded = Route.useLoaderData();
  const [rows, setRows] = useState(loaded.rows);
  return (
    <AdminFrame>
      <h1 className="font-display text-4xl">Reports</h1>
      {loaded.error ? <p className="mt-2 text-sm">{loaded.error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={String(row.id)} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex gap-2">
              <Badge>{String(row.status)}</Badge>
              <Badge>{String(row.category)}</Badge>
              <Badge>{String(row.targetType)}</Badge>
            </div>
            <p className="mt-2 text-sm">{String(row.details)}</p>
            <p className="mt-1 text-xs text-faint">Target {String(row.targetId)} · reporter {String(row.reporterId)}</p>
            {row.status === "open" ? (
              <Button className="mt-3" variant="ghost" type="button" onClick={() => void adminCloseReport({ data: String(row.id) }).then(async () => setRows(await adminReports()))}>
                Close
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
