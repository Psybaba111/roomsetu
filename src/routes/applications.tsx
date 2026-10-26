import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Badge, Button, Empty } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { myApplications, setApplicationStatus } from "@/lib/roomsetu/account-api";

export const Route = createFileRoute("/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof myApplications>> | null>(null);
  function load() {
    void myApplications().then(setData).catch(() => undefined);
  }
  useEffect(() => {
    if (user) load();
  }, [user]);

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Applications</h1>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-4 text-sm"><Link to="/login" className="text-primary">Sign in</Link></p> : null}
      {data ? (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-medium">You sent</h2>
            <div className="mt-3 space-y-3">
              {data.sent.map((row) => (
                <article key={String(row.id)} className="rounded-xl border border-line bg-surface p-4">
                  <Badge>{String(row.status)}</Badge>
                  <p className="mt-2 font-medium">{String(row.title)}</p>
                  <p className="text-sm text-muted">{String(row.cityName)}</p>
                  <p className="mt-2 text-sm">{String(row.message)}</p>
                  {row.status === "pending" ? (
                    <Button className="mt-3" variant="ghost" type="button" onClick={() => void setApplicationStatus({ data: { id: String(row.id), status: "withdrawn" } }).then(() => { toast.success("Withdrawn"); load(); })}>Withdraw</Button>
                  ) : null}
                </article>
              ))}
              {data.sent.length === 0 ? <Empty title="No applications yet" body="Apply from a listing when a room fits." /> : null}
            </div>
          </section>
          <section>
            <h2 className="font-medium">For your rooms</h2>
            <div className="mt-3 space-y-3">
              {data.received.map((row) => (
                <article key={String(row.id)} className="rounded-xl border border-line bg-surface p-4">
                  <Badge>{String(row.status)}</Badge>
                  <p className="mt-2 font-medium">{String(row.seekerName || "Seeker")}</p>
                  <p className="text-sm text-muted">{String(row.title)} · {String(row.seekerOccupation || "")}</p>
                  <p className="mt-2 text-sm">{String(row.message)}</p>
                  {row.status === "pending" ? (
                    <div className="mt-3 flex gap-2">
                      <Button type="button" onClick={() => void setApplicationStatus({ data: { id: String(row.id), status: "accepted" } }).then(load)}>Accept</Button>
                      <Button type="button" variant="ghost" onClick={() => void setApplicationStatus({ data: { id: String(row.id), status: "declined" } }).then(load)}>Decline</Button>
                    </div>
                  ) : null}
                </article>
              ))}
              {data.received.length === 0 ? <Empty title="No applications received" body="They show up here when someone applies to your listing." /> : null}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
