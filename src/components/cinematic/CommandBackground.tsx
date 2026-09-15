"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useApp } from "@/store/appStore";

type Props = {
  /** 0..1 intensity — command center uses ~1, side pages ~0.6 */
  intensity?: number;
  className?: string;
  /** Shared-intelligence tone (V3): globe lighting follows the same AI tone as the core. */
  tone?: "ok" | "warn" | "critical";
  /** Geo-engine focus (V3): sos = red lock ring, risk = amber region ring, null = neutral. */
  focusKind?: "sos" | "risk" | null;
};

const TONE_COLOR: Record<string, number> = {
  ok: 0x00d2ff,
  warn: 0xffb020,
  critical: 0xff5470,
};

/**
 * Full-screen procedural command environment: holographic earth, data arcs,
 * hazard pulses, particle dust + grid haze. Vanilla Three.js, no assets.
 * Degrades to CSS gradient when WebGL / reduced-motion / weak device.
 * V3: tone + focusKind mirror the shared DRISHTI-X system state — the globe
 * is a view of the same truth as the AI core, alerts, risk and SOS.
 * NOTE: the globe is schematic, not a geographic projection — focus rings
 * signal system state, never a surveyed position.
 */
export default function CommandBackground({ intensity = 1, className = "", tone = "ok", focusKind = null }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { qualityMode } = useApp();
  const qualityRef = useRef(qualityMode);
  qualityRef.current = qualityMode;
  const mouse = useRef({ x: 0, y: 0 });
  const toneRef = useRef(tone);
  toneRef.current = tone;
  const focusRef = useRef(focusKind);
  focusRef.current = focusKind;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isLow = qualityRef.current === "low";
    const isHigh = qualityRef.current === "high";
    const weak =
      isLow ||
      /Mobi|Android/i.test(navigator.userAgent) ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    if (reduced) return; // keep CSS fallback only

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !weak, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // WebGL unavailable → CSS fallback stays
    }
    const el = mount;
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, weak ? 1 : 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020b14, 0.028);
    const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    cam.position.set(0, 1.4, 11);

    scene.add(new THREE.AmbientLight(0x3a6a8a, 0.9));
    const key = new THREE.DirectionalLight(0x9beaff, 1.4);
    key.position.set(6, 4, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x00d2ff, 12, 40);
    rim.position.set(-6, -2, 4);
    scene.add(rim);

    // --- V3 geo-engine focus ring: red lock (sos) / amber region (risk) ---
    const focusRingMat = new THREE.MeshBasicMaterial({
      color: 0xffb020, transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const focusRing = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.016, 8, 128), focusRingMat);
    focusRing.rotation.x = Math.PI / 2.3;
    focusRing.position.y = 0.4;
    focusRing.visible = false;
    scene.add(focusRing);
    const focusTarget = new THREE.Color(0xffb020);
    const toneTarget = new THREE.Color(TONE_COLOR[toneRef.current] ?? 0x00d2ff);
    const packetTint = new THREE.Color(0xd8f6ff);

    // --- Holographic earth (layered: core / atmosphere / data / incident / drone) ---
    const earth = new THREE.Group();
    earth.position.set(0, 0.4, 0);
    earth.rotation.z = 0.12; // slight axial tilt for depth
    scene.add(earth);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.1, weak ? 32 : 48, weak ? 24 : 32),
      new THREE.MeshStandardMaterial({
        color: 0x06182e,
        emissive: 0x03202f,
        emissiveIntensity: 0.7,
        roughness: 0.65,
        metalness: 0.25,
        transparent: true,
        opacity: 0.96,
      })
    );
    earth.add(sphere);

    // wireframe lat/long shell (subtle geographic grid)
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(3.14, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff, wireframe: true, transparent: true, opacity: 0.08 })
    );
    earth.add(wire);

    // atmospheric rim glow — BackSide shell for soft limb lighting (no bloom pass needed)
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(3.32, 40, 28),
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: {
          c: { value: new THREE.Color(0x1fb6d5) },
        },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float rim = pow(1.0 - abs(vN.z), 2.6); gl_FragColor = vec4(c, rim * 0.55); }`,
      })
    );
    earth.add(atmo);

    // orbital traces — thin paths with travelling satellite dots (drone-route layer)
    const orbiters: { dot: THREE.Mesh; r: number; speed: number; phase: number; tiltX: number; tiltY: number }[] = [];
    const orbitDefs = [
      { r: 4.1, speed: 0.22, tiltX: Math.PI / 2.35, tiltY: 0.15 },
      { r: 4.7, speed: -0.15, tiltX: Math.PI / 1.75, tiltY: 0.5 },
    ];
    orbitDefs.forEach((o) => {
      const path = new THREE.Mesh(
        new THREE.TorusGeometry(o.r, 0.006, 6, 160),
        new THREE.MeshBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.28 })
      );
      path.rotation.x = o.tiltX;
      path.rotation.y = o.tiltY;
      scene.add(path);
      for (let k = 0; k < 2; k++) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xbfefff })
        );
        scene.add(dot);
        orbiters.push({ dot, r: o.r, speed: o.speed, phase: k * Math.PI + o.tiltY, tiltX: o.tiltX, tiltY: o.tiltY });
      }
    });

    // glowing geographic rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.012, 8, 128), ringMat);
    ring1.rotation.x = Math.PI / 2.25;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.008, 8, 128), ringMat.clone());
    ring2.material.opacity = 0.18;
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.y = 0.4;
    scene.add(ring1, ring2);

    // hazard pulses on the globe
    const hazards: { mesh: THREE.Mesh; phase: number }[] = [];
    const hazardGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const hazardSpots: [number, number, number][] = [
      [1.4, 1.5, 2.4],
      [-2.2, 0.4, 2.1],
      [0.4, -1.8, 2.5],
      [-1.1, 2.2, -1.9],
      [2.5, -0.6, -1.7],
    ];
    hazardSpots.forEach(([x, y, z], i) => {
      const m = new THREE.Mesh(
        hazardGeo,
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xff5470 : i % 3 === 1 ? 0xffb020 : 0x00e5ff })
      );
      m.position.set(x, y, z);
      earth.add(m);
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.2, 24),
        new THREE.MeshBasicMaterial({ color: m.material.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
      );
      halo.position.copy(m.position);
      halo.lookAt(0, 0.4 - 0.4, 0);
      halo.position.multiplyScalar(1.02);
      earth.add(halo);
      hazards.push({ mesh: halo as THREE.Mesh, phase: i * 1.3 });
    });

    // data arcs between hazard nodes + animated packets riding the curves
    const arcMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.5 });
    const arcs = new THREE.Group();
    const flowCurves: THREE.QuadraticBezierCurve3[] = [];
    for (let i = 0; i < hazardSpots.length; i++) {
      const a = new THREE.Vector3(...hazardSpots[i]);
      const b = new THREE.Vector3(...hazardSpots[(i + 2) % hazardSpots.length]);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(4.4);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      flowCurves.push(curve);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
      arcs.add(new THREE.Line(geo, arcMat));
    }
    earth.add(arcs);
    // regional links: India beacon → nearest hazard cells (operational network feel)
    const indiaPos: [number, number, number] = [1.15, 1.35, 2.55];
    const indiaVec = new THREE.Vector3(...indiaPos);
    const regionMat = new THREE.LineBasicMaterial({ color: 0x7de9ff, transparent: true, opacity: 0.4 });
    [0, 1, 2].forEach((hi) => {
      const hz = new THREE.Vector3(...hazardSpots[hi % hazardSpots.length]);
      const mid = indiaVec.clone().add(hz).multiplyScalar(0.5).normalize().multiplyScalar(4.1);
      const curve = new THREE.QuadraticBezierCurve3(indiaVec.clone(), mid, hz);
      flowCurves.push(curve);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
      arcs.add(new THREE.Line(geo, regionMat));
    });
    // data packets: small bright motes travelling the network (occasional, cheap)
    const PACKETS = weak ? 4 : 9;
    const packets: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[] = [];
    const packetGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xd8f6ff });
    for (let i = 0; i < PACKETS; i++) {
      const mesh = new THREE.Mesh(packetGeo, packetMat);
      const curve = flowCurves[i % flowCurves.length];
      earth.add(mesh);
      packets.push({ mesh, curve, t: (i / PACKETS + Math.random() * 0.1) % 1, speed: 0.10 + (i % 3) * 0.035 });
    }

    // drone orbiters
    const drones: THREE.Mesh[] = [];
    const droneGeo = new THREE.OctahedronGeometry(0.09);
    const droneMat = new THREE.MeshBasicMaterial({ color: 0xaef4ff });
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(droneGeo, droneMat);
      scene.add(d);
      drones.push(d);
    }

    // particle dust (GPU-friendly Points)
    const P = isLow ? 120 : isHigh ? 750 : 380;
    const pos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = -4 - Math.random() * 10;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x5fd8ff, size: 0.045, transparent: true, opacity: 0.55 * intensity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    scene.add(dust);

    // data-stream particles — sparse bright motes drifting sideways (volumetric haze feel)
    const S = isLow ? 30 : isHigh ? 160 : 80;
    const spos = new Float32Array(S * 3);
    for (let i = 0; i < S; i++) {
      spos[i * 3] = (Math.random() - 0.5) * 24;
      spos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      spos[i * 3 + 2] = -2 - Math.random() * 8;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
    const streams = new THREE.Points(
      sGeo,
      new THREE.PointsMaterial({ color: 0x9beaff, size: 0.07, transparent: true, opacity: 0.5 * intensity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    scene.add(streams);

    // floor grid
    const grid = new THREE.GridHelper(40, 48, 0x1fb6d5, 0x0b2f47);
    grid.position.y = -3.4;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35 * intensity;
    scene.add(grid);

    // --- cinematic scan beam: slow vertical sweep plane (volumetric feel) ---
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 0.5),
      new THREE.MeshBasicMaterial({
        color: 0x00d2ff, transparent: true, opacity: 0.07 * intensity,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    beam.rotation.x = -Math.PI / 2.4;
    beam.position.y = -2;
    scene.add(beam);

    // --- India focus marker (pulsing cyan beacon on the globe, rotates with earth) ---
    const india = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x7de9ff })
    );
    india.position.set(1.15, 1.35, 2.55);
    earth.add(india);
    const indiaHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.26, 28),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    indiaHalo.position.copy(india.position).multiplyScalar(1.02);
    indiaHalo.lookAt(0, 0, 0);
    earth.add(indiaHalo);

    // --- floating AI nodes: sparse holographic waypoints with gentle bob ---
    const aiNodes: { mesh: THREE.Mesh; baseY: number; phase: number }[] = [];
    const aiGeo = new THREE.OctahedronGeometry(0.08);
    const aiMat = new THREE.MeshBasicMaterial({ color: 0x9beaff, transparent: true, opacity: 0.75 });
    const aiSpots: [number, number, number][] = weak
      ? [[-5.5, 1.5, -3], [5.5, 0.5, -4]]
      : [[-5.5, 1.5, -3], [5.5, 0.5, -4], [-4, -1.5, 2], [4.5, 2.2, 1]];
    aiSpots.forEach(([x, y, z], i) => {
      const m = new THREE.Mesh(aiGeo, aiMat);
      m.position.set(x, y, z);
      scene.add(m);
      aiNodes.push({ mesh: m, baseY: y, phase: i * 1.7 });
    });

    const onMouse = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const y = Math.min(1, window.scrollY / (window.innerHeight || 1));
      cam.position.y = 1.4 + y * 1.6;
    };
    window.addEventListener("pointermove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      const nw = el.clientWidth || window.innerWidth;
      const nh = el.clientHeight || window.innerHeight;
      renderer?.setSize(nw, nh);
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let t = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    const clock = new THREE.Clock();
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(el);
    const onVis = () => {
      pageVisible = !document.hidden;
      clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVis);
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || !pageVisible) return; // park GPU when offscreen/hidden
      const dt = Math.min(0.05, clock.getDelta());
      t += dt;
      // eased cinematic rotation (smooth ramp, no judder)
      earth.rotation.y += dt * (0.10 + Math.min(0.04, t * 0.002));
      wire.rotation.y -= dt * 0.015;
      ring1.rotation.z += dt * 0.05;
      ring2.rotation.z -= dt * 0.03;
      hazards.forEach((hz, i) => {
        const s = 1 + Math.sin(t * 2.2 + hz.phase) * 0.35;
        hz.mesh.scale.set(s, s, 1);
        (hz.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2.2 + hz.phase) * 0.25;
        void i;
      });
      drones.forEach((d, i) => {
        const a = t * (0.25 + i * 0.04) + (i * Math.PI * 2) / 5;
        d.position.set(Math.cos(a) * (4.6 + (i % 2) * 0.7), 0.4 + Math.sin(t * 0.9 + i) * 1.1, Math.sin(a) * (4.6 + (i % 2) * 0.7));
      });
      // data packets ride the network curves (earth-local space, rotates with globe)
      packets.forEach((p) => {
        p.t += dt * p.speed;
        if (p.t > 1) p.t = 0;
        p.mesh.position.copy(p.curve.getPoint(p.t));
      });
      // orbital trace dots travel their tilted paths
      orbiters.forEach((o) => {
        const a = t * o.speed * 2 + o.phase;
        const x = Math.cos(a) * o.r;
        const z = Math.sin(a) * o.r;
        const v = new THREE.Vector3(x, 0, z).applyEuler(new THREE.Euler(o.tiltX, o.tiltY, 0));
        o.dot.position.set(v.x, v.y + 0.4, v.z);
      });
      const dp = dust.geometry.attributes.position as THREE.BufferAttribute;
      const arr = dp.array as Float32Array;
      for (let i = 0; i < dp.count; i += 3) {
        arr[i + 1] += dt * 0.12;
        if (arr[i + 1] > 7) arr[i + 1] = -7;
      }
      dp.needsUpdate = true;
      const sp = streams.geometry.attributes.position as THREE.BufferAttribute;
      const sarr = sp.array as Float32Array;
      for (let i = 0; i < sp.count; i += 3) {
        sarr[i] += dt * (0.25 + (i % 5) * 0.05);
        if (sarr[i] > 12) sarr[i] = -12;
      }
      sp.needsUpdate = true;
      // cinematic scan-beam sweep + India beacon pulse + AI node drift
      beam.position.y = -2 + (Math.sin(t * 0.35) * 0.5 + 0.5) * 4.5;
      (beam.material as THREE.MeshBasicMaterial).opacity = (0.05 + Math.sin(t * 0.7) * 0.02) * intensity;
      const indiaS = 1 + Math.sin(t * 2.4) * 0.3;
      indiaHalo.scale.set(indiaS, indiaS, 1);
      (indiaHalo.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 2.4) * 0.2;
      aiNodes.forEach((n) => {
        n.mesh.position.y = n.baseY + Math.sin(t * 0.8 + n.phase) * 0.35;
        n.mesh.rotation.y += dt * 0.6;
        n.mesh.rotation.x += dt * 0.25;
      });
      // V3 shared-state lighting: rim + packets drift toward the AI tone
      // (smooth lerp, no snapping); focus ring marks sos/risk system state.
      toneTarget.setHex(TONE_COLOR[toneRef.current] ?? 0x00d2ff);
      const tk = 1 - Math.exp(-dt * 3.2);
      rim.color.lerp(toneTarget, tk);
      packetTint.setHex(0xd8f6ff).lerp(toneTarget, 0.45);
      packetMat.color.lerp(packetTint, tk * 0.6);
      const fk = focusRef.current;
      if (fk) {
        focusTarget.setHex(fk === "sos" ? 0xff5470 : 0xffb020);
        focusRingMat.color.lerp(focusTarget, tk);
        focusRing.visible = true;
        const fp = 1 + Math.sin(t * (fk === "sos" ? 2.4 : 1.6)) * 0.022;
        focusRing.scale.set(fp, fp, fp);
        focusRingMat.opacity += ((fk === "sos" ? 0.55 : 0.4) - focusRingMat.opacity) * tk;
        focusRing.rotation.z += dt * 0.12;
      } else {
        focusRingMat.opacity += (0 - focusRingMat.opacity) * tk;
        if (focusRingMat.opacity < 0.02) focusRing.visible = false;
      }
      // mouse parallax (subtle, cinematic)
      cam.position.x += (mouse.current.x * 0.9 - cam.position.x) * 0.03;
      cam.lookAt(0, 0.3, 0);
      renderer?.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = null;
    };
  }, [intensity]);

  return (
    <div className={`dx-bg ${className}`} aria-hidden="true">
      <div ref={mountRef} className="dx-bg-canvas" />
      <div className="dx-bg-gradient" />
      <div className="dx-bg-scanlines" />
      <div className="dx-bg-vignette" />
    </div>
  );
}
