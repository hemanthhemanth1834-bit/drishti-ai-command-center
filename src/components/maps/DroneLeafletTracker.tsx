"use client";
import RadarMap from "../RadarMap";

/** Stitch route path — forwards live GPS into the canonical radar map. */
export default function DroneLeafletTracker({
  lat = 17.385,
  lon = 78.4867,
}: {
  lat?: number;
  lon?: number;
}) {
  return <RadarMap lat={lat} lon={lon} />;
}
