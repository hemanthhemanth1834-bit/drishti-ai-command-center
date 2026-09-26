"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type TwinEntity = { id: string; label: string; kind: string; risk?: string };

const ENTITIES: (TwinEntity & { pos: [number, number, number]; color: number })[] = [
  { id: "RB-07", label: "NDRF Boat RB-07", kind: "boat", pos: [-2.5, 0.1, 1.5], color: 0x34d399 },
  { id: "AMB-12", label: "Ambulance AMB-12", kind: "ground", pos: [2.2, 0.1, -1.8], color: 0xfbbf24 },
  { id: "DRX-07", label: "Drone DRX-07", kind: "air", pos: [0, 1.5, 0], color: 0x00d2ff },
  { id: "HSP-01", label: "District General Hospital", kind: "hospital", pos: [3.4, 0.15, 2.1], color: 0x38bdf8 },
  { id: "SH-01", label: "City Sports Shelter", kind: "shelter", pos: [-3.6, 0.15, -2.3], color: 0xa78bfa },
  { id: "BRG-02", label: "Railway Bridge Pier P-18", kind: "bridge", pos: [0.6, 0.45, -3.2], color: 0xf59e0b },
  { id: "FRT-03", label: "Fire Tender FRT-03", kind: "vehicle", pos: [-1.6, 0.1, -2.7], color: 0xef4444 },
  { id: "HZ-FL", label: "Flood cell — riverside wards", kind: "hazard", risk: "HIGH (simulated): discharge >45k cusecs may inundate low streets. Prepare evacuation.", pos: [1.8, 0.15, 2.6], color: 0xfb923c },
  { id: "HZ-FR", label: "Fire-risk cell — industrial belt", kind: "hazard", risk: "MODERATE (simulated): chemical storage + dry spell. No active fire.", pos: [-3.0, 0.15, 0.6], color: 0xf87171 },
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
  /** STEP 30 — hazard marker visibility (scene ids HZ-FL / HZ-FR). */
  hazards?: { flood: boolean; fire: boolean };
  /** STEP 30 — emergency corridor + vehicles visibility. */
  corridor?: boolean;
  /** STEP 30 — camera preset: distance + focus target. Null = free orbit. */
  camPreset?: { dist: number; focus: [number, number, number] } | null;
  /** STEP 30 — false freezes decorative motion + snaps camera (reduced motion). */
  motionOK?: boolean;
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
  hazards = { flood: true, fire: true },
  corridor = true,
  camPreset = null,
  motionOK = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ alt, surgeM, spotlight, dropFlash, batteryPct, signalPct, terrain, hazards, corridor, camPreset, motionOK });
  live.current = { alt, surgeM, spotlight, dropFlash, batteryPct, signalPct, terrain, hazards, corridor, camPreset, motionOK };
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

    scene.add(new THREE.GridHelper(14, 32, 0x66f6ff, 0x0e5068));

    // Terrain slab with subtle elevation noise (procedural city base)
    const terrainMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x0a2036, roughness: 0.9 })
    );
    terrainMesh.position.y = -0.15;
    scene.add(terrainMesh);

    // --- Procedural city: river, glowing roads, extruded buildings, corridor ---
    const city = new THREE.Group();
    scene.add(city);
    // Animated river (Krishna reach) — diagonal translucent band
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0e7fa8, transparent: true, opacity: 0.55, roughness: 0.25, metalness: 0.35,
    });
    const river = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = 0.5;
    river.position.set(-0.6, 0.005, 0);
    city.add(river);
    // Bridge deck over river + edge lighting (cyan runway dots)
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x274b63, roughness: 0.6 })
    );
    bridge.position.set(0.5, 0.32, -3.1);
    bridge.rotation.y = -0.18;
    city.add(bridge);
    const bridgeLightGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const bridgeLightMat = new THREE.MeshBasicMaterial({ color: 0x7de9ff });
    for (let bi = 0; bi < 6; bi++) {
      const bl = new THREE.Mesh(bridgeLightGeo, bridgeLightMat);
      const bx = 0.5 - 2 + bi * 0.8;
      bl.position.set(bx, 0.42, -3.1 - 0.18 * (bx - 0.5) + 0.32);
      city.add(bl);
    }
    // River shimmer stripe — bright band travelling downstream (reflection feel)
    const shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.rotation.z = 0.5;
    shimmer.position.set(-0.6, 0.012, 0);
    city.add(shimmer);
    // Glowing road network
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 });
    const roadMat2 = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 });
    const road = (w: number, l: number, x: number, z: number, ry = 0, mat = roadMat) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = ry;
      m.position.set(x, 0.012, z);
      city.add(m);
      return m;
    };
    road(0.35, 13, -3.4, 0);
    road(0.35, 13, 2.6, 0.4);
    road(12, 0.35, 0, -1.2);
    road(12, 0.3, 0.2, 2.4);
    const corridor = road(0.5, 9, 0.6, 0, 0.5, roadMat2); // emergency corridor — amber, animated
    // Extruded building blocks (low-poly, emissive edges + window strips)
    const bColors = [0x0e2c46, 0x123a5c, 0x0c2740];
    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    const blocks: [number, number, number, number][] = [
      [-4.6, -3.4, 0.9, 0.7], [-2.2, -4.2, 1.2, 0.9], [1.6, -4.4, 0.8, 1.1],
      [4.2, -3.0, 1.0, 0.6], [-5.0, 0.4, 0.7, 1.2], [-2.4, 1.8, 1.1, 0.5],
      [2.0, 0.6, 1.3, 0.8], [4.6, 1.2, 0.9, 0.9], [-4.4, 4.2, 1.0, 0.6],
      [-1.4, 4.6, 1.4, 0.7], [3.6, 4.4, 0.8, 1.0],
    ];
    blocks.forEach(([x, z, w, hh], i) => {
      // deterministic height variation for a realistic skyline
      const jitter = 0.75 + ((i * 37) % 10) / 22;
      const H = hh * jitter;
      const m = new THREE.Mesh(
        bGeo,
        new THREE.MeshStandardMaterial({ color: bColors[i % 3], roughness: 0.7, emissive: 0x00d2ff, emissiveIntensity: 0.06 })
      );
      m.scale.set(w, H, w);
      m.position.set(x, H / 2, z);
      city.add(m);
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.02, 0.04, w + 0.02),
        new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.5 })
      );
      edge.position.set(x, H + 0.02, z);
      city.add(edge);
      // lit window strip on the south face (single cheap plane per block)
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.7, Math.max(0.06, H * 0.22)),
        new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.5 })
      );
      win.position.set(x, H * 0.55, z + w / 2 + 0.006);
      city.add(win);
    });
    // Holographic emergency-zone boundary
    const zoneWall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 1.1, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false })
    );
    zoneWall.position.set(1.4, 0.55, 2.0);
    city.add(zoneWall);
    // Moving emergency vehicles (amber body + white headlight beam + red tail)
    const vehicles: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const v = new THREE.Group();
      const vbody = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.1, 0.34),
        new THREE.MeshBasicMaterial({ color: 0xffb020 })
      );
      v.add(vbody);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.5, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      beam.rotation.x = Math.PI / 2;
      beam.position.set(0, 0.02, 0.4);
      v.add(beam);
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.04, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xff2d55 })
      );
      tail.position.set(0, 0.02, -0.18);
      v.add(tail);
      city.add(v);
      vehicles.push(v);
    }

    // Satellite imagery drape (Esri tile, swapped in when loaded)
    const satMat = new THREE.MeshBasicMaterial({ color: 0x020b14 });
    const satPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), satMat);
    satPlane.rotation.x = -Math.PI / 2;
    satPlane.position.y = -0.04;
    scene.add(satPlane);

    // --- Synthwave VFX rig (visible in grid mode) ---
    const vfx = new THREE.Group();
    scene.add(vfx);

    // Horizon glow bar + halo
    const glowBar = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x8cf7ff })
    );
    glowBar.position.set(0, 0.06, -7);
    vfx.add(glowBar);
    const gc = document.createElement("canvas");
    gc.width = 4;
    gc.height = 64;
    const g2 = gc.getContext("2d");
    if (g2) {
      const grad = g2.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, "rgba(0,210,255,0)");
      grad.addColorStop(0.75, "rgba(0,210,255,0.45)");
      grad.addColorStop(1, "rgba(160,250,255,0.85)");
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 4, 64);
    }
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 1.4),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(gc),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    halo.position.set(0, 0.7, -7.02);
    vfx.add(halo);

    // Radar sweep band looping across the floor
    const sweep = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 0.9),
      new THREE.MeshBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.03;
    vfx.add(sweep);

    // Rising dust particles
    const P_COUNT = 150;
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(P_COUNT * 3);
    for (let i = 0; i < P_COUNT; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 14;
      pArr[i * 3 + 1] = Math.random() * 3;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pArr, 3));
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0x66eaff,
        size: 0.05,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    vfx.add(points);

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
    // soft drone shadow blob (cheap grounding cue, follows x/z)
    const droneShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
    );
    droneShadow.rotation.x = -Math.PI / 2;
    droneShadow.position.y = 0.02;
    scene.add(droneShadow);

    // Pickable entity markers (STEP 30: hazard refs captured for layer toggles)
    const hzMeshes: Record<string, THREE.Mesh> = {};
    const pickables: THREE.Mesh[] = ENTITIES.filter((e) => e.kind !== "air").map((e) => {      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: e.color, emissive: e.color, emissiveIntensity: 0.5 })
      );
      m.position.set(...e.pos);
      m.userData.entity = { id: e.id, label: e.label, kind: e.kind, risk: e.risk };
      if (e.kind === "hazard") hzMeshes[e.id] = m;
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
    // STEP 30 — camera preset focus (lerped unless reduced motion) + applied-preset tracking
    const focusCur = new THREE.Vector3(0, 0.5, 0);
    const focusTgt = new THREE.Vector3(0, 0.5, 0);
    let appliedPreset = '';
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
      const s = live.current;
      const still = s.motionOK === false;
      if (!still) t += 0.016;
      // STEP 30 — camera preset: snap on change, then free orbit continues
      const presetKey = s.camPreset ? `${s.camPreset.dist}|${s.camPreset.focus.join(',')}` : '';
      if (presetKey !== appliedPreset) {
        appliedPreset = presetKey;
        if (s.camPreset) {
          distRef.current = Math.max(4, Math.min(20, s.camPreset.dist));
          focusTgt.set(...s.camPreset.focus);
          if (still) focusCur.copy(focusTgt);
        } else {
          focusTgt.set(0, 0.5, 0);
          if (still) focusCur.copy(focusTgt);
        }
      }
      if (!still) focusCur.lerp(focusTgt, 0.08);
      else focusCur.copy(focusTgt);
      // STEP 30 — layer visibility from props (additive toggles)
      if (hzMeshes['HZ-FL']) hzMeshes['HZ-FL'].visible = s.hazards.flood;
      if (hzMeshes['HZ-FR']) hzMeshes['HZ-FR'].visible = s.hazards.fire;
      corridor.visible = s.corridor;
      for (const v of vehicles) v.visible = s.corridor;
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
      drone.position.y = 1.2 + ((s.alt % 50) / 25) * 0.8 + (still ? 0 : Math.sin(t * 1.4) * 0.08);
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
      tmpDir.copy(cam.position).sub(focusCur);
      const curD = tmpDir.length() || HOME_DIST;
      tmpDir.normalize();
      const nextD = still
        ? Math.max(4, Math.min(20, distRef.current))
        : curD + (Math.max(4, Math.min(20, distRef.current)) - curD) * 0.18;
      cam.position.copy(focusCur).addScaledVector(tmpDir, nextD);
      cam.lookAt(focusCur);
      // Procedural city life: river shimmer, corridor vehicles, zone pulse
      riverMat.opacity = 0.45 + (still ? 0 : Math.sin(t * 1.8) * 0.1) + (Math.min(3.8, Math.max(0, s.surgeM)) / 3.8) * 0.25;
      // travelling shimmer stripe along the river
      if (!still) shimmer.position.z = Math.sin(t * 0.7) * 5.5;
      (shimmer.material as THREE.MeshBasicMaterial).opacity = 0.12 + (still ? 0 : Math.sin(t * 2.2) * 0.05);
      // animated emergency corridor (breathing amber path)
      (corridor.material as THREE.MeshBasicMaterial).opacity = 0.42 + (still ? 0 : Math.sin(t * 2.4) * 0.16);
      if (!still) zoneWall.rotation.y += 0.003;
      (zoneWall.material as THREE.MeshBasicMaterial).opacity = 0.08 + (still ? 0 : Math.sin(t * 2) * 0.03);
      vehicles.forEach((v, i) => {
        if (still) return;
        const p = (t * 0.35 + i / vehicles.length) % 1;
        v.position.x = -2.2 + p * 5.6;
        v.position.z = 0.4 + (v.position.x - 0.6) * 0.18;
        v.position.y = 0.08;
        v.rotation.y = -0.5; // align with corridor heading
      });
      // drone shadow tracks x/z, fades with altitude
      droneShadow.position.x = drone.position.x;
      droneShadow.position.z = drone.position.z;
      (droneShadow.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0.08, 0.42 - drone.position.y * 0.09);
      // Pulsing incident markers (hazards breathe; frozen under reduced motion)
      pickables.forEach((m) => {
        const kind = (m.userData.entity as { kind?: string })?.kind;
        if (kind === "hazard" && !still) {
          const s = 1 + Math.sin(t * 2.6 + m.position.x) * 0.22;
          m.scale.set(s, s, s);
        }
      });
      // Synthwave VFX rig (grid mode only; frozen under reduced motion)
      vfx.visible = s.terrain !== "satellite";
      if (vfx.visible && !still) {
        sweep.position.z -= 0.045;
        if (sweep.position.z < -7) sweep.position.z = 7;
        const pp = points.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pp.count; i++) {
          let y = pp.getY(i) + 0.008;
          if (y > 3) y = 0;
          pp.setY(i, y);
        }
        pp.needsUpdate = true;
      }
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
