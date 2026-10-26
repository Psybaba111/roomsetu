import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveRoomWanted } from "@/lib/roomsetu/account-api";
import { FURNISHED, GENDERS, GENDER_PREFS, ROOM_TYPES } from "@/lib/roomsetu/catalog";
import { listCities } from "@/lib/roomsetu/public-api";

export const Route = createFileRoute("/create-room-wanted")({
  loader: () => listCities(),
  component: CreateWanted,
});

function CreateWanted() {
  const places = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    cityId: "bengaluru",
    localities: "",
    budget: "15000",
    moveIn: "",
    durationMonths: "6",
    roomPref: "private",
    furnished: "semi",
    foodPref: "either",
    smoking: "no",
    pets: "no",
    roommateGender: "any",
    people: "1",
    bio: "",
    lifestyle: "Quiet on weeknights. I cook a few times a week.",
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      await saveRoomWanted({
        data: {
          ...form,
          age: form.age ? Number(form.age) : null,
          budget: Number(form.budget),
          durationMonths: Number(form.durationMonths),
          people: Number(form.people),
        },
      });
      toast.success("Request published");
      await navigate({ to: "/room-wanted" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">I need a room</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Tell hosts your budget, city, and how you live. This is a public post, not a private note.</p>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? <p className="mt-6 text-sm">Sign in to publish a room-wanted post.</p> : null}
      {user ? (
        <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <Field label="Name"><TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Age"><TextInput required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
          <Field label="Gender">
            <SelectInput value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              {GENDERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Occupation"><TextInput required value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></Field>
          <Field label="City wanted">
            <SelectInput value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              {places.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Preferred localities"><TextInput value={form.localities} onChange={(e) => setForm({ ...form, localities: e.target.value })} placeholder="Whitefield, HSR" /></Field>
          <Field label="Budget"><TextInput inputMode="numeric" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          <Field label="Move-in"><TextInput type="date" required value={form.moveIn} onChange={(e) => setForm({ ...form, moveIn: e.target.value })} /></Field>
          <Field label="Duration (months)"><TextInput value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} /></Field>
          <Field label="Room preference">
            <SelectInput value={form.roomPref} onChange={(e) => setForm({ ...form, roomPref: e.target.value })}>
              {ROOM_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Furnishing">
            <SelectInput value={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.value })}>
              {FURNISHED.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Food">
            <SelectInput value={form.foodPref} onChange={(e) => setForm({ ...form, foodPref: e.target.value })}>
              <option value="either">Either</option>
              <option value="yes">I want food</option>
              <option value="no">No food</option>
            </SelectInput>
          </Field>
          <Field label="Smoking">
            <SelectInput value={form.smoking} onChange={(e) => setForm({ ...form, smoking: e.target.value })}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="either">Either</option>
            </SelectInput>
          </Field>
          <Field label="Pets">
            <SelectInput value={form.pets} onChange={(e) => setForm({ ...form, pets: e.target.value })}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="either">Either</option>
            </SelectInput>
          </Field>
          <Field label="Roommate gender">
            <SelectInput value={form.roommateGender} onChange={(e) => setForm({ ...form, roommateGender: e.target.value })}>
              {GENDER_PREFS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="People moving"><TextInput value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Short bio"><TextArea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Lifestyle"><TextArea value={form.lifestyle} onChange={(e) => setForm({ ...form, lifestyle: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish request"}</Button>
          </div>
        </form>
      ) : null}
    </AppShell>
  );
}
