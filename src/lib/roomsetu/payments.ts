export const PLANS = [
  {
    id: "boost",
    label: "7-day boost",
    amountInr: 499,
    days: 7,
    needsListing: true,
    blurb: "Featured placement for seven days. The rent still goes to the host, not to RoomSetu.",
  },
  {
    id: "featured",
    label: "30-day featured",
    amountInr: 999,
    days: 30,
    needsListing: true,
    blurb: "Keeps one of your rooms in the featured sort for a month.",
  },
  {
    id: "tenant_premium",
    label: "Seeker pass",
    amountInr: 299,
    days: 30,
    needsListing: false,
    blurb: "A 30-day pass on your profile. It does not reveal anyone’s phone number.",
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export function planById(id: string) {
  return PLANS.find((plan) => plan.id === id) ?? null;
}
