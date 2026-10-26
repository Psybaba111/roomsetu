export const ROOM_TYPES = [
  { id: "private", label: "Private room" },
  { id: "shared", label: "Shared room" },
  { id: "master", label: "Master bedroom" },
  { id: "studio", label: "Studio" },
  { id: "1bhk", label: "1 BHK" },
  { id: "2bhk", label: "2 BHK" },
  { id: "3bhk", label: "3 BHK" },
  { id: "pg_bed", label: "PG bed" },
  { id: "other", label: "Other" },
] as const;

export const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment" },
  { id: "independent_house", label: "Independent house" },
  { id: "pg", label: "PG" },
  { id: "coliving", label: "Co-living" },
  { id: "villa", label: "Villa" },
] as const;

export const FURNISHED = [
  { id: "furnished", label: "Furnished" },
  { id: "semi", label: "Semi-furnished" },
  { id: "unfurnished", label: "Unfurnished" },
] as const;

export const AMENITIES = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "ac", label: "AC" },
  { id: "kitchen", label: "Kitchen access" },
  { id: "washing", label: "Washing machine" },
  { id: "parking", label: "Parking" },
  { id: "backup", label: "Power backup" },
  { id: "lift", label: "Lift" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "attached_bath", label: "Attached bathroom" },
  { id: "balcony", label: "Balcony" },
  { id: "food", label: "Food available" },
] as const;

export const GENDERS = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "other", label: "Other" },
] as const;

export const GENDER_PREFS = [
  { id: "any", label: "Anyone" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
] as const;

export const OCCUPANT_PREFS = [
  { id: "any", label: "Anyone" },
  { id: "professional", label: "Working professional" },
  { id: "student", label: "Student" },
] as const;

export const USER_TYPES = [
  { id: "looking", label: "Looking for a room" },
  { id: "offering", label: "Offering a room" },
  { id: "both", label: "Both" },
] as const;

export const REPORT_CATEGORIES = [
  { id: "scam", label: "Scam" },
  { id: "fake", label: "Fake listing" },
  { id: "wrong", label: "Wrong information" },
  { id: "harassment", label: "Harassment" },
  { id: "unsafe", label: "Unsafe property" },
  { id: "illegal", label: "Illegal activity" },
  { id: "duplicate", label: "Duplicate listing" },
  { id: "other", label: "Other" },
] as const;

export const PHOTO_CATEGORIES = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Living room",
  "Building exterior",
  "Common areas",
  "Amenities",
] as const;

export function labelOf(list: readonly { id: string; label: string }[], id: string) {
  return list.find((item) => item.id === id)?.label ?? id;
}

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
