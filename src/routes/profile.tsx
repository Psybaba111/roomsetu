import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, saveProfile } from "@/lib/roomsetu/account-api";
import { GENDERS, USER_TYPES } from "@/lib/roomsetu/catalog";
import { listCities } from "@/lib/roomsetu/public-api";

export const Route = createFileRoute("/profile")({
  loader: () => listCities(),
  component: ProfilePage,
});

function ProfilePage() {
  const places = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    age: "",
    gender: "",
    cityId: "",
    occupation: "",
    userType: "looking",
    preferredCities: "",
    about: "",
    profile: "public",
    budget: "",
    smoking: "no",
    pets: "no",
    food: "either",
  });
  const [meta, setMeta] = useState({ role: "", verification: "", since: "" });

  useEffect(() => {
    if (!user) return;
    void ensureProfile({ data: { fullName: user.displayName ?? "", email: user.primaryEmail ?? "" } }).then((profile) => {
      if (!profile) return;
      setForm({
        fullName: profile.fullName,
        mobile: profile.mobile,
        age: profile.age ? String(profile.age) : "",
        gender: profile.gender,
        cityId: profile.cityId,
        occupation: profile.occupation,
        userType: profile.userType,
        preferredCities: profile.preferredCities,
        about: profile.about,
        profile: profile.privacy.profile || "public",
        budget: profile.lifestyle.budget || "",
        smoking: profile.lifestyle.smoking || "no",
        pets: profile.lifestyle.pets || "no",
        food: profile.lifestyle.food || "either",
      });
      setMeta({ role: profile.role, verification: profile.verificationStatus, since: profile.createdAt.slice(0, 10) });
    });
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await saveProfile({
        data: {
          fullName: form.fullName,
          mobile: form.mobile,
          age: form.age ? Number(form.age) : null,
          gender: form.gender,
          cityId: form.cityId,
          occupation: form.occupation,
          userType: form.userType,
          preferredCities: form.preferredCities,
          about: form.about,
          lifestyle: { budget: form.budget, smoking: form.smoking, pets: form.pets, food: form.food },
          privacy: { profile: form.profile, contact: "hidden", listing: "public" },
        },
      });
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Profile</h1>
      {isPending ? <div className="mt-6 h-24 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? (
        <p className="mt-4 text-sm">
          <button type="button" className="text-primary" onClick={() => void navigate({ to: "/login" })}>Sign in</button> to edit your profile.
        </p>
      ) : null}
      {user ? (
        <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <p className="text-sm text-muted sm:col-span-2">
            {user.primaryEmail} · {meta.role || "member"} · verification {meta.verification || "unverified"} · member since {meta.since || "today"}
          </p>
          <Field label="Name"><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Mobile" hint="Never shown on listings."><TextInput value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
          <Field label="Age"><TextInput value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
          <Field label="Gender">
            <SelectInput value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              {GENDERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="City">
            <SelectInput value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">Select</option>
              {places.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Occupation"><TextInput value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></Field>
          <Field label="I use RoomSetu to">
            <SelectInput value={form.userType} onChange={(e) => setForm({ ...form, userType: e.target.value })}>
              {USER_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Profile visibility">
            <SelectInput value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })}>
              <option value="public">Public about text</option>
              <option value="private">Hide about text</option>
            </SelectInput>
          </Field>
          <Field label="Budget for matching"><TextInput value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          <Field label="Preferred cities"><TextInput value={form.preferredCities} onChange={(e) => setForm({ ...form, preferredCities: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="About me"><TextArea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></Field></div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
            <Link to="/verification" className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">Verification</Link>
          </div>
        </form>
      ) : null}
    </AppShell>
  );
}
