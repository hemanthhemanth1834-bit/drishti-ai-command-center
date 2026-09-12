"use client";
import RadarMap, { type MapCircle } from "../RadarMap";

/** Stitch route path — forwards live GPS + optional overlays into the canonical radar map. */
export default function DroneLeafletTracker({
  lat = 17.385,
  lon = 78.4867,
  circles = [],
  grid = false,
  target = null,
}: {
  lat?: number;
  lon?: number;
  circles?: MapCircle[];
  grid?: boolean;
  target?: { lat: number; lon: number; label?: string } | null;
}) {
  return <RadarMap lat={lat} lon={lon} circles={circles} grid={grid} target={target} />;
}
