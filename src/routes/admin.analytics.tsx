import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin-frame";
import { Button, Field, TextInput } from "@/components/ui";
import { adminAddPlace, adminAudit, adminConversations, adminDashboard } from "@/lib/roomsetu/admin-api";

export const Route = createFileRoute("/admin/analytics")({
  loader: async () => {
    try {
      const [dash, audit, conversations] = await Promise.all([adminDashboard(), adminAudit(), adminConversations()]);
      return { dash, audit, conversations, error: "" };
    } catch (error) {
      return { dash: null, audit: [], conversations: [], error: error instanceof Error ? error.message : "Forbidden" };
    }
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const loaded = Route.useLoaderData();
  const [kind, setKind] = useState("city");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [cityId, setCityId] = useState("bengaluru");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await adminAddPlace({ data: { kind, id, name, state, cityId } });
      toast.success("Place added");
      setId("");
      setName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add");
    }
  }

  const k = loaded.dash?.kpis;
  return (
    <AdminFrame>
      <h1 className="font-display text-4xl">Analytics</h1>
      {loaded.error ? <p className="mt-2 text-sm">{loaded.error}</p> : null}
      {k ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-line bg-surface p-4 text-sm">
            <h2 className="font-medium">Supply</h2>
            <p>{Number(k.listings)} listings · {Number(k.active_listings)} active · {Number(k.occupied)} occupied</p>
            <p>{Number(k.hosts)} hosts · {Number(k.properties)} properties</p>
          </article>
          <article className="rounded-xl border border-line bg-surface p-4 text-sm">
            <h2 className="font-medium">Demand</h2>
            <p>{Number(k.seekers)} seekers · {Number(k.wanted)} room-wanted posts</p>
            <p>{Number(k.searches)} recorded searches · {Number(k.applications)} applications</p>
          </article>
          <article className="rounded-xl border border-line bg-surface p-4 text-sm">
            <h2 className="font-medium">Conversation metadata</h2>
            <ul className="mt-1 space-y-1">
              {loaded.conversations.slice(0, 8).map((row) => (
                <li key={String(row.id)}>{String(row.messages)} messages · listing {String(row.listingId || "—")}</li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">Add a city or locality</h2>
        <Field label="Kind">
          <select className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="city">City</option>
            <option value="locality">Locality</option>
          </select>
        </Field>
        <Field label="Id" hint="Letters, numbers, hyphens">
          <TextInput value={id} onChange={(event) => setId(event.target.value)} placeholder="hubballi" />
        </Field>
        <Field label="Name"><TextInput value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label={kind === "city" ? "State" : "City id"}>
          <TextInput value={kind === "city" ? state : cityId} onChange={(event) => (kind === "city" ? setState(event.target.value) : setCityId(event.target.value))} />
        </Field>
        <Button type="submit">Add place</Button>
      </form>
      <h2 className="mt-8 font-medium">Audit log</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {loaded.audit.map((row) => (
          <li key={row.id} className="text-muted">{row.createdAt.slice(0, 16).replace("T", " ")} · {row.action} · {row.target}</li>
        ))}
      </ul>
    </AdminFrame>
  );
}
