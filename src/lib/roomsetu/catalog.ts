export const ROOM_TYPES = [
  { id: "private", label: "Private room" },
  { id: "shared", label: "Shared room" },
  { id: "master", label: "Master bedroom" },
  { id: "studio", label: "Studio" },
  { id: "1bhk", label: "1 BHK" },
  { id: "2bhk", label: "2 BHK" },
  { id: "3bhk", label: "3 BHK" },
  { id: "4bhk", label: "4 BHK" },
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
  { id: "security", label: "Security" },
  { id: "gas", label: "Piped gas" },
  { id: "gym", label: "Gym" },
  { id: "club", label: "Clubhouse" },
  { id: "park", label: "Park" },
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

export const FACING = [
  { id: "east", label: "East" },
  { id: "west", label: "West" },
  { id: "north", label: "North" },
  { id: "south", label: "South" },
  { id: "north_east", label: "North-east" },
  { id: "north_west", label: "North-west" },
  { id: "south_east", label: "South-east" },
  { id: "south_west", label: "South-west" },
] as const;

export const SUITABLE_FOR = [
  { id: "family", label: "Family" },
  { id: "bachelors", label: "Bachelors" },
  { id: "anyone", label: "Anyone" },
] as const;

export type PropertyFacts = {
  builtUpSqft: number | null;
  bathrooms: number | null;
  balconies: number | null;
  floor: number | null;
  totalFloors: number | null;
  facing: string;
  society: string;
  maintenance: number | null;
  suitableFor: string;
  postedBy: "owner";
};

export function emptyFacts(): PropertyFacts {
  return {
    builtUpSqft: null,
    bathrooms: null,
    balconies: null,
    floor: null,
    totalFloors: null,
    facing: "",
    society: "",
    maintenance: null,
    suitableFor: "anyone",
    postedBy: "owner",
  };
}

function factNum(value: unknown, max: number) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(max, Math.round(n));
}

export function parseFacts(input: unknown): PropertyFacts {
  let raw: Record<string, unknown> = {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown;
      if (parsed && typeof parsed === "object") raw = parsed as Record<string, unknown>;
    } catch {
      raw = {};
    }
  } else if (input && typeof input === "object") {
    raw = input as Record<string, unknown>;
  }
  const facing = typeof raw.facing === "string" ? raw.facing : "";
  const suitable = typeof raw.suitableFor === "string" ? raw.suitableFor : "";
  const society = typeof raw.society === "string" ? raw.society.trim().slice(0, 80) : "";
  return {
    builtUpSqft: factNum(raw.builtUpSqft, 20000),
    bathrooms: factNum(raw.bathrooms, 10),
    balconies: factNum(raw.balconies, 8),
    floor: factNum(raw.floor, 80),
    totalFloors: factNum(raw.totalFloors, 80),
    facing: FACING.some((item) => item.id === facing) ? facing : "",
    society,
    maintenance: factNum(raw.maintenance, 100000),
    suitableFor: SUITABLE_FOR.some((item) => item.id === suitable) ? suitable : "anyone",
    postedBy: "owner",
  };
}

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
