export type SeekerPrefs = {
  cityId: string;
  budget: number | null;
  moveIn: string | null;
  roomType: string;
  gender: string;
  occupation: string;
  smoking: string;
  pets: string;
  food: string;
  durationMonths: number | null;
};

export type ListingFacts = {
  cityId: string;
  monthlyRent: number;
  availableFrom: string;
  roomType: string;
  genderPref: string;
  occupantPref: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  foodAvailable: boolean;
  minStayMonths: number;
};

export type MatchReason = {
  label: string;
  tone: "Excellent" | "Good" | "Fair" | "Poor";
};

export type MatchResult = {
  score: number;
  reasons: MatchReason[];
  note: string;
};

function tone(points: number, max: number): MatchReason["tone"] {
  const ratio = max === 0 ? 0 : points / max;
  if (ratio >= 0.85) return "Excellent";
  if (ratio >= 0.55) return "Good";
  if (ratio >= 0.25) return "Fair";
  return "Poor";
}

function day(iso: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(t) ? null : t;
}

const ROOM_FAMILY: Record<string, string> = {
  private: "room",
  master: "room",
  shared: "shared",
  pg_bed: "shared",
  studio: "flat",
  "1bhk": "flat",
  "2bhk": "flat",
  "3bhk": "flat",
  other: "other",
};

export function matchScore(listing: ListingFacts, prefs: SeekerPrefs): MatchResult {
  let city = 0;
  if (!prefs.cityId) city = 10;
  else if (prefs.cityId === listing.cityId) city = 24;
  const cityMax = 24;

  let budget = 0;
  if (!prefs.budget) budget = 8;
  else if (listing.monthlyRent <= prefs.budget) budget = 20;
  else if (listing.monthlyRent <= prefs.budget * 1.15) budget = 12;
  else if (listing.monthlyRent <= prefs.budget * 1.4) budget = 5;
  const budgetMax = 20;

  let move = 0;
  const want = day(prefs.moveIn);
  const avail = day(listing.availableFrom);
  if (want == null || avail == null) move = 6;
  else {
    const delta = (avail - want) / 86400000;
    if (delta <= 14 && delta >= -21) move = 12;
    else if (delta <= 45) move = 7;
    else move = 2;
  }
  const moveMax = 12;

  let room = 0;
  if (!prefs.roomType || prefs.roomType === "any") room = 6;
  else if (prefs.roomType === listing.roomType) room = 12;
  else if (ROOM_FAMILY[prefs.roomType] && ROOM_FAMILY[prefs.roomType] === ROOM_FAMILY[listing.roomType])
    room = 7;
  const roomMax = 12;

  let gender = 8;
  let genderClash = false;
  if (listing.genderPref === "women" && prefs.gender === "man") {
    gender = 0;
    genderClash = true;
  } else if (listing.genderPref === "men" && prefs.gender === "woman") {
    gender = 0;
    genderClash = true;
  }
  const genderMax = 8;

  let work = 3;
  const occ = prefs.occupation.toLowerCase();
  const isStudent = occ.includes("student") || occ.includes("intern");
  if (listing.occupantPref === "any" || !prefs.occupation) work = 4;
  else if (listing.occupantPref === "student" && isStudent) work = 6;
  else if (listing.occupantPref === "professional" && prefs.occupation && !isStudent) work = 6;
  else work = 1;
  const workMax = 6;

  let smoking = 3;
  if (prefs.smoking === "either" || !prefs.smoking) smoking = 3;
  else if (prefs.smoking === "yes" && listing.smokingAllowed) smoking = 5;
  else if (prefs.smoking === "no" && !listing.smokingAllowed) smoking = 5;
  else smoking = 0;
  const smokeMax = 5;

  let pets = 2;
  if (prefs.pets === "either" || prefs.pets === "no" || !prefs.pets) pets = listing.petsAllowed || prefs.pets !== "yes" ? 3 : 3;
  if (prefs.pets === "yes") pets = listing.petsAllowed ? 4 : 0;
  else if (prefs.pets === "no") pets = 4;
  const petsMax = 4;

  let food = 2;
  if (prefs.food === "yes") food = listing.foodAvailable ? 4 : 1;
  else if (prefs.food === "no") food = 4;
  else food = 3;
  const foodMax = 4;

  let stay = 2;
  if (!prefs.durationMonths) stay = 3;
  else if (prefs.durationMonths >= listing.minStayMonths) stay = 5;
  else stay = 1;
  const stayMax = 5;

  let score = city + budget + move + room + gender + work + smoking + pets + food + stay;
  if (genderClash) score = Math.max(0, score - 18);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const lifestylePts = work + smoking + pets + food;
  const lifestyleMax = workMax + smokeMax + petsMax + foodMax;

  return {
    score,
    reasons: [
      { label: "Budget", tone: tone(budget, budgetMax) },
      { label: "Location", tone: tone(city, cityMax) },
      { label: "Move-in date", tone: tone(move, moveMax) },
      { label: "Room", tone: tone(room, roomMax) },
      { label: "Lifestyle", tone: tone(lifestylePts, lifestyleMax) },
      { label: "Stay length", tone: tone(stay, stayMax) },
    ],
    note: genderClash
      ? "The host’s gender preference does not match your profile."
      : score >= 80
        ? "A strong fit on the details that usually decide a room."
        : score >= 60
          ? "Worth a conversation. A few preferences are only a partial match."
          : "A looser fit. Read the house rules before you enquire.",
  };
}
