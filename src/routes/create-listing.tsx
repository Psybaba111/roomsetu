import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveListing } from "@/lib/roomsetu/account-api";
import { AMENITIES, FURNISHED, GENDER_PREFS, OCCUPANT_PREFS, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/roomsetu/catalog";
import { listCities } from "@/lib/roomsetu/public-api";
import { CURATED_PHOTOS } from "@/lib/roomsetu/storage";

export const Route = createFileRoute("/create-listing")({
  loader: () => listCities(),
  component: CreateListing,
});

function CreateListing() {
  const places = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cityId, setCityId] = useState("bengaluru");
  const [form, setForm] = useState({
    title: "",
    propertyType: "apartment",
    roomType: "private",
    address: "",
    localityId: "",
    pincode: "",
    monthlyRent: "14000",
    deposit: "28000",
    availableFrom: "",
    minStayMonths: "3",
    maxStayMonths: "",
    furnished: "semi",
    genderPref: "any",
    ageMin: "",
    ageMax: "",
    occupantPref: "any",
    roommatePref: "",
    occupants: "1",
    description: "",
    houseRules: "No parties. Quiet after 10:30 pm.",
    guestPolicy: "Occasional guests with a day's notice",
    amenities: ["wifi", "kitchen"] as string[],
    photos: [CURATED_PHOTOS[0].url] as string[],
  });

  const localities = places.localities.filter((item) => item.cityId === cityId);

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      const result = await saveListing({
        data: {
          ...form,
          cityId,
          localityId: form.localityId || localities[0]?.id || "",
          monthlyRent: Number(form.monthlyRent),
          deposit: Number(form.deposit),
          minStayMonths: Number(form.minStayMonths),
          maxStayMonths: form.maxStayMonths ? Number(form.maxStayMonths) : null,
          ageMin: form.ageMin ? Number(form.ageMin) : null,
          ageMax: form.ageMax ? Number(form.ageMax) : null,
          occupants: Number(form.occupants),
          photos: form.photos.map((url) => ({
            url,
            category: CURATED_PHOTOS.find((photo) => photo.url === url)?.category ?? "Bedroom",
          })),
        },
      });
      if (result.duplicate) toast.message("Published, and flagged as similar to another of your listings.");
      else toast.success("Listing is live");
      await navigate({ to: "/listing/$id", params: { id: result.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">List a room</h1>
      <p className="mt-1 text-sm text-muted">Step {step + 1} of 3. Listing is free. A paid boost is optional after you publish.</p>
      {isPending ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-line" /> : null}
      {!isPending && !user ? (
        <p className="mt-6 text-sm">
          <button type="button" className="font-medium text-primary" onClick={() => void navigate({ to: "/login" })}>
            Sign in
          </button>{" "}
          to publish. You can still browse without an account.
        </p>
      ) : null}
      {user ? (
        <form onSubmit={publish} className="mt-6 max-w-2xl space-y-4">
          {step === 0 ? (
            <>
              <Field label="Title">
                <TextInput required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Private room near a metro" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Property type">
                  <SelectInput value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })}>
                    {PROPERTY_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Room type">
                  <SelectInput value={form.roomType} onChange={(event) => setForm({ ...form, roomType: event.target.value })}>
                    {ROOM_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="City">
                  <SelectInput value={cityId} onChange={(event) => { setCityId(event.target.value); setForm({ ...form, localityId: "" }); }}>
                    {places.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Locality">
                  <SelectInput value={form.localityId} onChange={(event) => setForm({ ...form, localityId: event.target.value })}>
                    <option value="">Select</option>
                    {localities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Address" hint="Shown only to you. Seekers see the locality.">
                  <TextInput value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </Field>
                <Field label="Pincode">
                  <TextInput value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} />
                </Field>
              </div>
            </>
          ) : null}
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Monthly rent"><TextInput inputMode="numeric" value={form.monthlyRent} onChange={(event) => setForm({ ...form, monthlyRent: event.target.value })} /></Field>
              <Field label="Security deposit"><TextInput inputMode="numeric" value={form.deposit} onChange={(event) => setForm({ ...form, deposit: event.target.value })} /></Field>
              <Field label="Available from"><TextInput type="date" required value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} /></Field>
              <Field label="Minimum stay (months)"><TextInput inputMode="numeric" value={form.minStayMonths} onChange={(event) => setForm({ ...form, minStayMonths: event.target.value })} /></Field>
              <Field label="Maximum stay"><TextInput inputMode="numeric" value={form.maxStayMonths} onChange={(event) => setForm({ ...form, maxStayMonths: event.target.value })} /></Field>
              <Field label="Furnishing">
                <SelectInput value={form.furnished} onChange={(event) => setForm({ ...form, furnished: event.target.value })}>
                  {FURNISHED.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Existing occupants"><TextInput inputMode="numeric" value={form.occupants} onChange={(event) => setForm({ ...form, occupants: event.target.value })} /></Field>
              <Field label="Guest policy"><TextInput value={form.guestPolicy} onChange={(event) => setForm({ ...form, guestPolicy: event.target.value })} /></Field>
            </div>
          ) : null}
          {step === 2 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Gender preference">
                  <SelectInput value={form.genderPref} onChange={(event) => setForm({ ...form, genderPref: event.target.value })}>
                    {GENDER_PREFS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Occupation preference">
                  <SelectInput value={form.occupantPref} onChange={(event) => setForm({ ...form, occupantPref: event.target.value })}>
                    {OCCUPANT_PREFS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Age from"><TextInput value={form.ageMin} onChange={(event) => setForm({ ...form, ageMin: event.target.value })} /></Field>
                <Field label="Age to"><TextInput value={form.ageMax} onChange={(event) => setForm({ ...form, ageMax: event.target.value })} /></Field>
              </div>
              <Field label="Roommate preference"><TextInput value={form.roommatePref} onChange={(event) => setForm({ ...form, roommatePref: event.target.value })} /></Field>
              <Field label="Description"><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
              <Field label="House rules"><TextArea value={form.houseRules} onChange={(event) => setForm({ ...form, houseRules: event.target.value })} /></Field>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Amenities</legend>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((item) => {
                    const on = form.amenities.includes(item.id);
                    return (
                      <button key={item.id} type="button" onClick={() => setForm({ ...form, amenities: toggle(form.amenities, item.id) })} className={`h-10 rounded-md border px-3 text-sm ${on ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface"}`}>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Photos</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CURATED_PHOTOS.map((photo) => {
                    const on = form.photos.includes(photo.url);
                    return (
                      <button key={photo.url} type="button" onClick={() => setForm({ ...form, photos: toggle(form.photos, photo.url) })} className={`overflow-hidden rounded-lg border ${on ? "border-primary" : "border-line"}`}>
                        <img src={photo.url} alt={photo.label} className="h-20 w-full object-cover" />
                        <span className="block px-2 py-1 text-left text-xs">{photo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          ) : null}
          <div className="flex gap-2">
            {step > 0 ? <Button type="button" variant="ghost" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
            {step < 2 ? <Button type="button" onClick={() => setStep((value) => value + 1)}>Continue</Button> : <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</Button>}
          </div>
        </form>
      ) : null}
    </AppShell>
  );
}
