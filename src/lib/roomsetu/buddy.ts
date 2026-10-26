export type BuddySeeker = {
  wantedId: string;
  userId: string;
  name: string;
  age: number | null;
  gender: string;
  occupation: string;
  localities: string;
  budget: number;
  moveIn: string;
  roommateGender: string;
  isDemo: boolean;
};

export type BuddyPick = {
  people: Array<BuddySeeker & { reasons: string[] }>;
  combinedBudget: number;
  coversRent: boolean;
  summary: string;
};

export function seatsFor(roomType: string) {
  if (roomType === "2bhk") return 2;
  if (roomType === "3bhk") return 3;
  if (roomType === "4bhk") return 4;
  return 0;
}

export function localityHit(localities: string, localityName: string) {
  const needle = localityName.trim().toLowerCase();
  if (!needle) return false;
  return localities
    .toLowerCase()
    .split(",")
    .some((part) => {
      const name = part.trim();
      return name === needle || name.includes(needle) || needle.includes(name);
    });
}

function day(iso: string) {
  const t = Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(t) ? null : t;
}

function listingAllows(genderPref: string, gender: string) {
  if (genderPref === "women") return gender === "woman";
  if (genderPref === "men") return gender === "man";
  return true;
}

function pairOk(a: BuddySeeker, b: BuddySeeker) {
  if (a.roommateGender === "women" && b.gender !== "woman") return false;
  if (a.roommateGender === "men" && b.gender !== "man") return false;
  if (b.roommateGender === "women" && a.gender !== "woman") return false;
  if (b.roommateGender === "men" && a.gender !== "man") return false;
  return true;
}

function groupOk(people: BuddySeeker[]) {
  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      if (!pairOk(people[i], people[j])) return false;
    }
  }
  return true;
}

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function scoreOne(person: BuddySeeker, share: number, availableFrom: string) {
  let points = 0;
  if (person.budget >= share) points += 40;
  else if (person.budget >= share * 0.8) points += 24;
  else points += 8;
  const want = day(person.moveIn);
  const open = day(availableFrom);
  if (want == null || open == null) points += 10;
  else {
    const gap = Math.abs(want - open) / 86400000;
    if (gap <= 21) points += 30;
    else if (gap <= 45) points += 18;
    else points += 6;
  }
  if (person.roommateGender === "any") points += 10;
  return points;
}

function personReasons(person: BuddySeeker, localityName: string, share: number) {
  const reasons = [`Searching in ${localityName}`];
  reasons.push(person.budget >= share ? `Budget ${inr(person.budget)} covers a ${inr(share)} share` : `Budget ${inr(person.budget)} is under a ${inr(share)} share`);
  return reasons;
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (items.length < k) return [];
  const [head, ...rest] = items;
  if (!head) return [];
  return [...combinations(rest, k - 1).map((combo) => [head, ...combo]), ...combinations(rest, k)];
}

export function pickBuddies(input: {
  localityName: string;
  genderPref: string;
  monthlyRent: number;
  availableFrom: string;
  seats: number;
  seekers: BuddySeeker[];
}): BuddyPick {
  const share = input.seats > 0 ? Math.ceil(input.monthlyRent / input.seats) : input.monthlyRent;
  const pool = input.seekers.filter(
    (person) => localityHit(person.localities, input.localityName) && listingAllows(input.genderPref, person.gender),
  );
  if (pool.length < input.seats) {
    const people = pool.map((person) => ({ ...person, reasons: personReasons(person, input.localityName, share) }));
    const combinedBudget = people.reduce((sum, person) => sum + person.budget, 0);
    return {
      people,
      combinedBudget,
      coversRent: combinedBudget >= input.monthlyRent && people.length === input.seats,
      summary:
        people.length === 0
          ? `No one searching ${input.localityName} is free to fill this ${input.seats} BHK yet.`
          : `${people.length} of ${input.seats} people searching ${input.localityName}. The flat stays open until the group is full.`,
    };
  }
  const ranked = [...pool].sort(
    (a, b) => scoreOne(b, share, input.availableFrom) - scoreOne(a, share, input.availableFrom),
  );
  const shortlist = ranked.slice(0, 9);
  let best: BuddySeeker[] | null = null;
  let bestScore = -1;
  for (const combo of combinations(shortlist, input.seats)) {
    if (!groupOk(combo)) continue;
    const combined = combo.reduce((sum, person) => sum + person.budget, 0);
    const score =
      combo.reduce((sum, person) => sum + scoreOne(person, share, input.availableFrom), 0) +
      (combined >= input.monthlyRent ? 30 : 0);
    if (score > bestScore) {
      best = combo;
      bestScore = score;
    }
  }
  const chosen = best ?? ranked.slice(0, input.seats);
  const people = chosen.map((person) => ({ ...person, reasons: personReasons(person, input.localityName, share) }));
  const combinedBudget = people.reduce((sum, person) => sum + person.budget, 0);
  const coversRent = combinedBudget >= input.monthlyRent;
  return {
    people,
    combinedBudget,
    coversRent,
    summary: coversRent
      ? `${people.length} people searching ${input.localityName}. Together ${inr(combinedBudget)} covers the ${inr(input.monthlyRent)} rent.`
      : `${people.length} people searching ${input.localityName}. Together ${inr(combinedBudget)}, short of the ${inr(input.monthlyRent)} rent.`,
  };
}
