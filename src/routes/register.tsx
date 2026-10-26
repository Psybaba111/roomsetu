import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, Field, SelectInput, TextInput } from "@/components/ui";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, saveProfile } from "@/lib/roomsetu/account-api";
import { GENDERS, USER_TYPES } from "@/lib/roomsetu/catalog";
import { listCities } from "@/lib/roomsetu/public-api";

export const Route = createFileRoute("/register")({
  loader: () => listCities(),
  component: RegisterPage,
});

function RegisterPage() {
  const places = Route.useLoaderData();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    cityId: "bengaluru",
    occupation: "",
    userType: "looking",
    preferredCities: "bengaluru",
  });

  useEffect(() => {
    if (places.cities[0] && form.cityId === "bengaluru" && !places.cities.some((city) => city.id === "bengaluru")) {
      setForm((current) => ({ ...current, cityId: places.cities[0].id }));
    }
  }, [places.cities, form.cityId]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    const created = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.fullName,
      callbackURL: "/dashboard",
    });
    if (created.error) {
      setBusy(false);
      toast.error(created.error.message ?? "Could not create the account");
      return;
    }
    try {
      await ensureProfile({ data: { fullName: form.fullName, email: form.email } });
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
          about: "",
          lifestyle: {},
          privacy: { profile: "public", contact: "hidden", listing: "public" },
        },
      });
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account created, but the profile did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl">Create your account</h1>
        <p className="mt-2 text-sm text-muted">One person can look for a room and offer one. Mobile OTP and ID checks are reviewed later — nothing here sends a code yet.</p>
        {isPending ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-line" /> : null}
        {!isPending && user ? (
          <p className="mt-6 text-sm">You already have a session. <Link to="/profile" className="text-primary">Edit your profile</Link></p>
        ) : null}
        {!isPending && !user ? (
          <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput required value={form.fullName} onChange={(event) => set("fullName", event.target.value)} />
            </Field>
            <Field label="Mobile">
              <TextInput required inputMode="tel" value={form.mobile} onChange={(event) => set("mobile", event.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput required type="email" autoComplete="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
            </Field>
            <Field label="Password">
              <TextInput required type="password" autoComplete="new-password" value={form.password} onChange={(event) => set("password", event.target.value)} />
            </Field>
            <Field label="Age">
              <TextInput required inputMode="numeric" value={form.age} onChange={(event) => set("age", event.target.value)} />
            </Field>
            <Field label="Gender">
              <SelectInput required value={form.gender} onChange={(event) => set("gender", event.target.value)}>
                <option value="">Select</option>
                {GENDERS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Current city">
              <SelectInput value={form.cityId} onChange={(event) => set("cityId", event.target.value)}>
                {places.cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Occupation">
              <TextInput required value={form.occupation} onChange={(event) => set("occupation", event.target.value)} />
            </Field>
            <Field label="I am">
              <SelectInput value={form.userType} onChange={(event) => set("userType", event.target.value)}>
                {USER_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Preferred cities" hint="Comma-separated city ids, for example bengaluru, pune">
              <TextInput value={form.preferredCities} onChange={(event) => set("preferredCities", event.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
              <p className="mt-3 text-sm">Already registered? <Link to="/login" className="text-primary">Sign in</Link></p>
            </div>
          </form>
        ) : null}
      </div>
    </AppShell>
  );
}
