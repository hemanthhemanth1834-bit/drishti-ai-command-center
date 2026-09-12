"use client";
import DigitalTwin from "../DigitalTwin";

/** Stitch route path — forwards live altitude into the canonical twin. */
export default function DigitalTwinCanvas({ alt = 120 }: { alt?: number }) {
  return <DigitalTwin alt={alt} />;
}
