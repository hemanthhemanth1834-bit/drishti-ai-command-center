"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type TwinEntity = { id: string; label: string; kind: string };

const ENTITIES: (TwinEntity & { pos: [number, number, number]; color: number })[] = [
  { id: "RB-07", label: "NDRF Boat RB-07", kind: "boat", pos: [-2.5, 0.1, 1.5], color: 0x34d399 },
  { id: "AMB-12", label: "Ambulance AMB-12", kind: "ground", pos: [2.2, 0.1, -1.8], color: 0xfbbf24 },
  { id: "DRX-07", label: "Drone DRX-07", kind: "air", pos: [0, 1.5, 0], color: 0x00d2ff },
];

export type TerrainMode = 'grid' | 'satellite';

type Props = {
  alt?: number;
  surgeM?: number;
  spotlight?: boolean;
  height?: number;
  dropFlash?: number;
  /** Live battery % — tints the drone body green/amber/red. */
  batteryPct?: number;
  /** Live signal % — drives spotlight cone opacity. */
  signalPct?: number;
  /** Ground style. Satellite drapes Esri World Imagery under the grid. */
  terrain?: TerrainMode;
  /** Map center for the satellite tile (live GPS). */
  mapLat?: number;
  mapLon?: number;
  onSelect?: (e: TwinEntity | null) => void;
};

/** Slippy-map tile for a lat/lon at zoom z (Esri World Imagery). */
export function esriTile(lat: number, lon: number, z = 16): { key: string; url: string } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latR = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n
  );
  return { key: `${z}/${x}/${y}`, url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}` };
}

/** Full-viewport WebGL twin: terrain grid, surge plane, spotlight cone, pickable entities. */
export default function TwinViewport({
  alt = 120,
  surgeM = 0,
  spotlight = true,
  height = 460,
  dropFlash = 0,
  batteryPct = 100,
  signalPct = 90,
  terrain = 'satellite',
  mapLat = 17.385,
  mapLon = 78.4867,
  onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ alt, surgeM, spotlight, dropFlash, batteryPct, signalPct, terrain });
  live.current = { alt, surgeM, spotlight, dropFlash, batteryPct, signalPct, terrain };
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  // --- Simple zoom state (shared by wheel, buttons, pinch) ---
  const HOME_DIST = 9;
  const distRef = useRef(HOME_DIST);
  const clampDist = (d: number) => Math.max(4, Math.min(20, d));
  function zoomBy(factor: number) {
    distRef.current = clampDist(distRef.current * factor);
  }
  function resetZoom() {
    distRef.current = HOME_DIST;
  }

  // Satellite tile texture, refreshed when the map center crosses a tile boundary.
  const tile = esriTile(mapLat, mapLon, 16);
  const satTex = useRef<THREE.Texture | null>(null);
  useEffect(() => {
    if (terrain !== 'satellite') return;
    let cancelled = false;
    new THREE.TextureLoader()
      .setCrossOrigin('anonymous')
      .loadAsync(tile.url)
      .then((t) => {
        if (cancelled) return;
        t.colorSpace = THREE.SRGBColorSpace;
        if (satTex.current) satTex.current.dispose();
        satTex.current = t;
      })
      .catch(() => {
        /* offline tile → dark terrain fallback */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.key, terrain]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const w = el.clientWidth || 640;
    const h = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020b14);
    scene.fog = new THREE.Fog(0x020b14, 12, 30);

    const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    cam.position.set(5.5, 4.2, 6.5);
    cam.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.GridHelper(14, 28, 0x00d2ff, 0x0a3a55));

    // Terrain slab
    const terrainMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x0a2036, roughness: 0.9 })
    );
    terrainMesh.position.y = -0.15;
    scene.add(terrainMesh);

    // Satellite imagery drape (Esri tile, swapped in when loaded)
    const satMat = new THREE.MeshBasicMaterial({ color: 0x020b14 });
    const satPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), satMat);
    satPlane.rotation.x = -Math.PI / 2;
    satPlane.position.y = -0.04;
    scene.add(satPlane);

    // Flood surge plane (translucent, height driven by slider)
    const surge = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
    );
    surge.rotation.x = -Math.PI / 2;
    scene.add(surge);

    // Drone body + spotlight cone
    const drone = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.18, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x0aa4c4, emissive: 0x06283d })
    );
    drone.add(body);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    cone.position.y = -1.3;
    cone.rotation.x = Math.PI;
    drone.add(cone);
    scene.add(drone);

    // Pickable entity markers
    const pickables: THREE.Mesh[] = ENTITIES.filter((e) => e.kind !== "air").map((e) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: e.color, emissive: e.color, emissiveIntensity: 0.5 })
      );
      m.position.set(...e.pos);
      m.userData.entity = { id: e.id, label: e.label, kind: e.kind };
      scene.add(m);
      return m;
    });
    // Drone marker follows the drone group
    const airMark = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff })
    );
    airMark.userData.entity = { id: "DRX-07", label: "Drone DRX-07", kind: "air" };
    drone.add(airMark);
    pickables.push(airMark);

    // Drop-flash ring (air-drop actuator feedback)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    scene.add(new THREE.DirectionalLight(0xffffff, 1.2).translateX(5).translateY(8).translateZ(3));
    scene.add(new THREE.AmbientLight(0x335566));

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const FOCUS = new THREE.Vector3(0, 0.5, 0);
    const tmpDir = new THREE.Vector3();
    const onPick = (ev: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, cam);
      const hit = ray.intersectObjects(pickables, false)[0];
      selectRef.current?.((hit?.object.userData.entity as TwinEntity) ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", onPick);

    // --- Simple zoom: wheel + pinch, smoothly applied in the loop ---
    const cvs = renderer.domElement;
    cvs.style.touchAction = "none";
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      distRef.current = Math.max(4, Math.min(20, distRef.current * Math.exp(ev.deltaY * 0.0012)));
    };
    cvs.addEventListener("wheel", onWheel, { passive: false });
    const pinch = new Map<number, { x: number; y: number }>();
    let pinchD0 = 0;
    const onPtrDown = (ev: PointerEvent) => {
      pinch.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch.size === 2) {
        const [a, b] = Array.from(pinch.values());
        pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const onPtrMove = (ev: PointerEvent) => {
      if (!pinch.has(ev.pointerId)) return;
      pinch.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch.size === 2 && pinchD0 > 0) {
        const [a, b] = Array.from(pinch.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 0) {
          distRef.current = Math.max(4, Math.min(20, (distRef.current * pinchD0) / d));
          pinchD0 = d;
        }
      }
    };
    const onPtrUp = (ev: PointerEvent) => {
      pinch.delete(ev.pointerId);
      pinchD0 = 0;
    };
    cvs.addEventListener("pointerdown", onPtrDown);
    cvs.addEventListener("pointermove", onPtrMove);
    cvs.addEventListener("pointerup", onPtrUp);
    cvs.addEventListener("pointercancel", onPtrUp);

    let raf = 0;
    let t = 0;
    let lastFlash = 0;
    let satOn = false;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      const s = live.current;
      // Satellite drape on/off (texture arrives async)
      const wantSat = s.terrain === 'satellite' && satTex.current !== null;
      if (wantSat !== satOn) {
        satOn = wantSat;
        if (wantSat && satTex.current) {
          satMat.map = satTex.current;
          satMat.color.setHex(0xffffff);
        } else {
          satMat.map = null;
          satMat.color.setHex(0x020b14);
        }
        satMat.needsUpdate = true;
      }
      // Drone bobs with live telemetry altitude
      drone.position.y = 1.2 + ((s.alt % 50) / 25) * 0.8 + Math.sin(t * 1.4) * 0.08;
      drone.rotation.y += 0.004;
      cone.visible = s.spotlight;
      // Spotlight brightness follows live link margin
      (cone.material as THREE.MeshBasicMaterial).opacity = s.spotlight
        ? 0.08 + (Math.max(0, Math.min(100, s.signalPct)) / 100) * 0.22
        : 0;
      // Drone body tint follows live battery: cyan → amber → red
      const batt = Math.max(0, Math.min(100, s.batteryPct));
      (body.material as THREE.MeshStandardMaterial).color.setHex(
        batt > 50 ? 0x0aa4c4 : batt > 20 ? 0xd97706 : 0xdc2626
      );
      // Surge plane height: 0..3.8m mapped to 0..1.6 scene units
      surge.position.y = 0.02 + (Math.min(3.8, Math.max(0, s.surgeM)) / 3.8) * 1.6;
      // Drop flash pulse
      if (s.dropFlash !== lastFlash) {
        lastFlash = s.dropFlash;
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9;
      }
      const rm = ring.material as THREE.MeshBasicMaterial;
      if (rm.opacity > 0) {
        rm.opacity = Math.max(0, rm.opacity - 0.02);
        const sc = 1 + (0.9 - rm.opacity) * 3;
        ring.scale.set(sc, sc, 1);
      }
      // Smooth dolly toward the requested zoom distance
      tmpDir.copy(cam.position).sub(FOCUS);
      const curD = tmpDir.length() || HOME_DIST;
      tmpDir.normalize();
      const nextD = curD + (Math.max(4, Math.min(20, distRef.current)) - curD) * 0.18;
      cam.position.copy(FOCUS).addScaledVector(tmpDir, nextD);
      cam.lookAt(FOCUS);
      renderer.render(scene, cam);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth || w;
      renderer.setSize(nw, h);
      cam.aspect = nw / h;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPick);
      cvs.removeEventListener("wheel", onWheel);
      cvs.removeEventListener("pointerdown", onPtrDown);
      cvs.removeEventListener("pointermove", onPtrMove);
      cvs.removeEventListener("pointerup", onPtrUp);
      cvs.removeEventListener("pointercancel", onPtrUp);
      renderer.dispose();
    };
  }, [height]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        <button
          onClick={() => zoomBy(1 / 1.3)}
          title="Zoom in"
          className="w-8 h-8 rounded-lg bg-[#030d17]/85 border border-[#00d2ff]/50 text-[#00d2ff] font-bold text-lg leading-none hover:bg-[#00d2ff]/20"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1.3)}
          title="Zoom out"
          className="w-8 h-8 rounded-lg bg-[#030d17]/85 border border-[#00d2ff]/50 text-[#00d2ff] font-bold text-lg leading-none hover:bg-[#00d2ff]/20"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          title="Reset view"
          className="w-8 h-8 rounded-lg bg-[#030d17]/85 border border-[#00d2ff]/50 text-[#00d2ff] font-bold text-sm leading-none hover:bg-[#00d2ff]/20"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
