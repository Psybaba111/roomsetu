/** Curated photos shipped with the prototype. Swap this module for S3, R2, or Supabase later. */
export const CURATED_PHOTOS = [
  { url: "/rooms/bedroom.jpg", category: "Bedroom", label: "Private bedroom" },
  { url: "/rooms/shared.jpg", category: "Bedroom", label: "Shared room" },
  { url: "/rooms/balcony.jpg", category: "Bedroom", label: "Room with balcony" },
  { url: "/rooms/studio.jpg", category: "Living room", label: "Studio" },
  { url: "/rooms/living.jpg", category: "Living room", label: "Living room" },
  { url: "/rooms/kitchen.jpg", category: "Kitchen", label: "Kitchen" },
  { url: "/rooms/pg.jpg", category: "Bedroom", label: "PG bed" },
  { url: "/rooms/exterior.jpg", category: "Building exterior", label: "Building" },
] as const;

export function isAllowedPhotoUrl(url: string) {
  if (CURATED_PHOTOS.some((photo) => photo.url === url)) return true;
  if (url.startsWith("/rooms/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
