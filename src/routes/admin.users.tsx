import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin-frame";
import { Badge, Button, SelectInput } from "@/components/ui";
import { adminSetUser, adminUsers } from "@/lib/roomsetu/admin-api";

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    try {
      return { rows: await adminUsers(), error: "" };
    } catch (error) {
      return { rows: [], error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const loaded = Route.useLoaderData();
  const [rows, setRows] = useState(loaded.rows);

  async function save(row: (typeof rows)[number], patch: { role?: string; suspended?: boolean; verificationStatus?: string }) {
    try {
      await adminSetUser({
        data: {
          userId: String(row.userId),
          role: patch.role ?? String(row.role),
          suspended: patch.suspended ?? Boolean(row.suspended),
          verificationStatus: patch.verificationStatus ?? String(row.verificationStatus),
        },
      });
      toast.success("Updated");
      setRows(await adminUsers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  return (
    <AdminFrame>
      <h1 className="font-display text-4xl">Users</h1>
      {loaded.error ? <p className="mt-2 text-sm text-muted">{loaded.error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={String(row.userId)} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{String(row.fullName)}</h2>
              {row.isDemo ? <Badge tone="warn">Demo</Badge> : <Badge tone="good">Live</Badge>}
              {row.suspended ? <Badge>Suspended</Badge> : null}
            </div>
            <p className="text-sm text-muted">{String(row.email)} · {String(row.occupation)} · {String(row.cityId || "no city")} · {String(row.userType)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SelectInput className="w-auto" value={String(row.role)} onChange={(event) => void save(row, { role: event.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </SelectInput>
              <SelectInput className="w-auto" value={String(row.verificationStatus)} onChange={(event) => void save(row, { verificationStatus: event.target.value })}>
                {["unverified", "pending", "verified", "rejected", "suspended"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </SelectInput>
              <Button type="button" variant={row.suspended ? "ghost" : "danger"} onClick={() => void save(row, { suspended: !row.suspended })}>
                {row.suspended ? "Restore" : "Suspend"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
