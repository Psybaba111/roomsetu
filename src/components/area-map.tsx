import { useEffect, useRef } from "react";
import type { MapPoint } from "@/lib/roomsetu/maps";
import "leaflet/dist/leaflet.css";

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  fitBounds: (bounds: unknown, options?: { padding?: [number, number]; maxZoom?: number }) => void;
  remove: () => void;
  invalidateSize: () => void;
  attributionControl?: { setPrefix: (prefix: string | false) => void };
};

type MarkerHandle = { bindPopup: (html: string) => void; on: (event: string, fn: () => void) => void };

type LeafletNs = {
  map: (el: HTMLElement, options?: { zoomControl?: boolean; scrollWheelZoom?: boolean }) => LeafletMap;
  tileLayer: (
    url: string,
    options?: { attribution?: string; subdomains?: string; maxZoom?: number },
  ) => { addTo: (map: LeafletMap) => void };
  circle: (
    center: [number, number],
    options?: { radius?: number; color?: string; weight?: number; fillColor?: string; fillOpacity?: number },
  ) => { addTo: (map: LeafletMap) => MarkerHandle };
  circleMarker: (
    center: [number, number],
    options?: { radius?: number; color?: string; weight?: number; fillColor?: string; fillOpacity?: number },
  ) => { addTo: (map: LeafletMap) => MarkerHandle };
  latLngBounds: (points: [number, number][]) => unknown;
};

export function AreaMap({
  points,
  mode = "pins",
  onSelect,
}: {
  points: MapPoint[];
  mode?: "pins" | "area";
  onSelect?: (point: MapPoint) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const signature = points.map((point) => `${point.lat},${point.lng},${point.label}`).join("|");

  useEffect(() => {
    const node = host.current;
    if (!node || points.length === 0) return;
    let map: LeafletMap | null = null;
    let cancelled = false;

    void import("leaflet").then((mod) => {
      if (cancelled || !host.current) return;
      const L = ((mod as { default?: LeafletNs }).default ?? mod) as unknown as LeafletNs;
      map = L.map(host.current, { scrollWheelZoom: false });
      map.attributionControl?.setPrefix(false);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "Map data OpenStreetMap, CARTO",
        subdomains: "abcd",
        maxZoom: 18,
      }).addTo(map);
      for (const point of points) {
        const marker =
          mode === "area"
            ? L.circle([point.lat, point.lng], {
                radius: 700,
                color: "#0e6b56",
                weight: 1.5,
                fillColor: "#0e6b56",
                fillOpacity: 0.18,
              }).addTo(map)
            : L.circleMarker([point.lat, point.lng], {
                radius: 7,
                color: "#0e6b56",
                weight: 2,
                fillColor: "#e5f3ee",
                fillOpacity: 0.95,
              }).addTo(map);
        marker.bindPopup(escapeHtml(point.label));
        if (onSelect && point.id) marker.on("click", () => onSelect(point));
      }
      if (points.length === 1) map.setView([points[0].lat, points[0].lng], mode === "area" ? 14 : 12);
      else map.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lng])), { padding: [28, 28], maxZoom: 12 });
      window.setTimeout(() => map?.invalidateSize(), 60);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // signature covers the point list without retriggering on a new array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, mode]);

  if (points.length === 0) return null;

  return <div ref={host} className="area-map" role="img" aria-label="Map of the approximate area" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "\u0026amp;";
      case "<":
        return "\u0026lt;";
      case ">":
        return "\u0026gt;";
      case "\"":
        return "\u0026quot;";
      default:
        return "\u0026#39;";
    }
  });
}
