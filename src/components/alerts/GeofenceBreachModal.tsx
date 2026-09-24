"use client";
import { useEffect, useMemo, useState } from "react";
import { HYDERABAD_GEOFENCE, isInsideGeofence } from "../../utils/geofenceDetection";
import { useDialogA11y } from "@/hooks/useDialogA11y";

type Props = {
  lat: number;
  lon: number;
  droneId?: string;
};

/** Ray-casting hazard breach modal — pops when a drone leaves the geofence. */
export default function GeofenceBreachModal({ lat, lon, droneId }: Props) {
  const breached = useMemo(
    () => !isInsideGeofence({ lat, lon }, HYDERABAD_GEOFENCE),
    [lat, lon]
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!breached) setDismissed(false);
  }, [breached]);

  // UI polish: focus moves into the alert on open, Escape acknowledges it.
  const open = breached && !dismissed;
  useDialogA11y(open, "dx-geofence-dialog", () => setDismissed(true));

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Geofence breach"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,8,16,0.72)",
        zIndex: 50,
      }}
    >
      <div
        id="dx-geofence-dialog"
        tabIndex={-1}
        className="card"
        style={{ maxWidth: 420, borderColor: "#ff5470", background: "#160a12" }}
      >
        <h3 style={{ marginTop: 0, color: "#ff8296" }}>⚠ GEOFENCE BREACH</h3>
        <p>
          {droneId ?? "Drone"} exited the Hyderabad operations polygon at{" "}
          {lat.toFixed(4)}, {lon.toFixed(4)}.
        </p>
        <button onClick={() => setDismissed(true)}>Acknowledge</button>
      </div>
    </div>
  );
}
