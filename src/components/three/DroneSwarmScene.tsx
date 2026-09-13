"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Detection = {
  id: string;
  lat: string;
  lon: string;
  confidence: number;
  distanceM: number;
  etaMin: number;
};

/**
 * Cinematic drone swarm: procedural bodies, nav lights, telemetry rings,
 * signal radius, scanning cones, formation flight, SAR grid + FLIR pulse.
 * Simulated telemetry is labeled as such in the overlay.
 */
export default function DroneSwarmScene({ height = 380 }: { height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"scan" | "analyze" | "detected">("scan");
  const [webglFail, setWebglFail] = useState(false);
  const detection: Detection = {
    id: "TGT-14 · WARD 14 BUND",
    lat: "16.5067°N",
    lon: "80.6480°E",
    confidence: 94.2,
    distanceM: 180,
    etaMin: 4.8,
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const weak = /Mobi|Android/i.test(navigator.userAgent);
    const W = el.clientWidth || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030d17);
    scene.fog = new THREE.Fog(0x030d17, 14, 34);
    const cam = new THREE.PerspectiveCamera(52, W / height, 0.1, 100);
    cam.position.set(6.5, 5, 8);
    cam.lookAt(0, 0.6, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !weak });
    } catch {
      setWebglFail(true);
      return;
    }
    if (!renderer) {
      setWebglFail(true);
      return;
    }
    renderer.setSize(W, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, weak ? 1 : 1.5));
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.GridHelper(16, 32, 0x22d3ee, 0x0e3a52));
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0x071626, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // SAR search grid (cyan lines)
    const gridLines = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.35 });
    for (let i = -4; i <= 4; i++) {
      const g1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 1.6, 0.02, -6.4), new THREE.Vector3(i * 1.6, 0.02, 6.4)]);
      const g2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.4, 0.02, i * 1.6), new THREE.Vector3(6.4, 0.02, i * 1.6)]);
      gridLines.add(new THREE.Line(g1, gridMat), new THREE.Line(g2, gridMat));
    }
    scene.add(gridLines);

    scene.add(new THREE.DirectionalLight(0xffffff, 1.3).translateX(5).translateY(8).translateZ(3));
    scene.add(new THREE.AmbientLight(0x3a5a78, 0.9));

    type Drone = {
      g: THREE.Group; cone: THREE.Mesh; ring: THREE.Mesh; strobe: THREE.Mesh;
      trail: THREE.Line; history: THREE.Vector3[];
      phase: number; base: number; prevHeading: number; seed: number;
    };
    const drones: Drone[] = [];
    const N = weak ? 4 : 6;
    for (let i = 0; i < N; i++) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x0aa4c4, emissive: 0x06283d, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.5,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), bodyMat);
      g.add(body);
      // arms
      const armMat = new THREE.MeshStandardMaterial({ color: 0x123a52 });
      [[0.35, 0.35], [-0.35, 0.35], [0.35, -0.35], [-0.35, -0.35]].forEach(([x, z]) => {
        const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), armMat);
        rotor.position.set(x, 0.06, z);
        g.add(rotor);
      });
      // nav lights (red/green) + strobe (white, blinks ~1Hz)
      const navL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4d5e }));
      navL.position.set(-0.32, 0, 0);
      const navR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      navR.position.set(0.32, 0, 0);
      const strobe = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      strobe.position.set(0, 0.1, 0);
      g.add(navL, navR, strobe);
      // scanning cone (FLIR)
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 2.2, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      );
      cone.position.y = -1.15;
      cone.rotation.x = Math.PI;
      g.add(cone);
      // telemetry ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.56, 32),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      g.add(ring);
      // signal radius disc
      const sig = new THREE.Mesh(
        new THREE.CircleGeometry(1.5, 32),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.05, depthWrite: false })
      );
      sig.rotation.x = -Math.PI / 2;
      sig.position.y = -1.9;
      g.add(sig);
      // motion trail (short fading path)
      const TRAIL = 22;
      const trailGeo = new THREE.BufferGeometry();
      const trailPos = new Float32Array(TRAIL * 3);
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      const trail = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.35 })
      );
      trail.frustumCulled = false;
      scene.add(trail);
      scene.add(g);
      const startA = (i / N) * Math.PI * 2;
      g.position.set(Math.cos(startA) * 3.4, 2.2 + (i % 3) * 0.5, Math.sin(startA) * 3.4);
      drones.push({
        g, cone, ring, strobe, trail,
        history: Array.from({ length: TRAIL }, () => g.position.clone()),
        phase: startA, base: 2.2 + (i % 3) * 0.5, prevHeading: -startA, seed: i * 1.7,
      });
    }

    // target marker (pulsing)
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xff5470 })
    );
    target.position.set(1.8, 0.15, 1.2);
    scene.add(target);
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0xff5470, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(1.8, 0.03, 1.2);
    scene.add(targetRing);

    let raf = 0;
    let t = 0;
    let onScreen = true;
    let pageOn = !document.hidden;
    const t0 = performance.now();
    let staged: "scan" | "analyze" | "detected" = "scan";
    const io = new IntersectionObserver((e) => {
      onScreen = e[0]?.isIntersecting ?? true;
    });
    io.observe(el);
    const onVis = () => {
      pageOn = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    const clock = new THREE.Clock();
    const tmpV = new THREE.Vector3();
    let frame = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!onScreen || !pageOn) {
        clock.getDelta();
        return;
      }
      const dt = reduced ? 0.016 : Math.min(0.05, clock.getDelta());
      t += reduced ? 0 : dt;
      frame += 1;
      const elapsed = (performance.now() - t0) / 1000;
      drones.forEach((d, i) => {
        const a = d.phase + t * 0.32;
        const rx = 3.4 + Math.sin(i * 1.7) * 0.8;
        const rz = 3.4 + Math.cos(i * 2.1) * 0.8;
        // smoothed target → eased acceleration (no snapping)
        tmpV.set(
          Math.cos(a) * rx,
          d.base + Math.sin(t * 1.1 + d.seed) * 0.22 + Math.sin(t * 2.3 + d.seed * 2) * 0.06,
          Math.sin(a) * rz
        );
        const k = reduced ? 1 : 1 - Math.pow(0.002, dt); // frame-rate independent ease
        d.g.position.lerp(tmpV, k);
        // heading + banking into turns (roll ∝ turn rate)
        const heading = -a;
        let turn = heading - d.prevHeading;
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        d.prevHeading = heading;
        d.g.rotation.y = heading;
        d.g.rotation.z += ((reduced ? 0 : THREE.MathUtils.clamp(turn * 8, -0.35, 0.35)) - d.g.rotation.z) * Math.min(1, dt * 5);
        d.g.rotation.x = Math.sin(t * 1.3 + d.seed) * 0.03; // hover pitch wobble
        const s = 1 + Math.sin(t * 3 + i) * 0.08;
        d.ring.scale.set(s, s, 1);
        // FLIR cone: scanning flicker + sweep pulse
        (d.cone.material as THREE.MeshBasicMaterial).opacity =
          0.11 + Math.sin(t * 2 + i * 1.4) * 0.04 + Math.sin(t * 9 + i * 3) * 0.015;
        // strobe double-blink
        (d.strobe.material as THREE.MeshBasicMaterial).opacity = 1;
        d.strobe.visible = reduced ? true : Math.sin(t * 6.5 + i) > 0.55;
        // trail history (every 3rd frame)
        if (frame % 3 === 0) {
          d.history.push(d.g.position.clone());
          if (d.history.length > 22) d.history.shift();
          const attr = d.trail.geometry.attributes.position as THREE.BufferAttribute;
          d.history.forEach((p, j) => attr.setXYZ(j, p.x, p.y, p.z));
          attr.needsUpdate = true;
        }
      });
      // target highlight brightens during ANALYZE, then steady pulse
      const analyzing = staged === "analyze";
      const pulse = 1 + Math.sin(t * (analyzing ? 6 : 3.2)) * (analyzing ? 0.55 : 0.35);
      targetRing.scale.set(pulse, pulse, 1);
      (targetRing.material as THREE.MeshBasicMaterial).opacity = analyzing ? 0.95 : 0.5 + Math.sin(t * 3.2) * 0.3;
      (target.material as THREE.MeshBasicMaterial).color.setHex(analyzing ? 0xffb020 : 0xff5470);
      if (!reduced) {
        cam.position.x = 6.5 + Math.sin(t * 0.12) * 0.8;
        cam.lookAt(0, 0.6, 0);
      }
      renderer?.render(scene, cam);
      // staged scripted detection (simulated): scan → analyze → detected
      if (staged === "scan" && elapsed > 5) {
        staged = "analyze";
        setPhase("analyze");
      } else if (staged === "analyze" && elapsed > 7) {
        staged = "detected";
        setPhase("detected");
      }
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth || W;
      renderer?.setSize(nw, height);
      cam.aspect = nw / height;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [height]);

  return (
    <div className="dx-swarm" style={{ height }}>
      <div ref={ref} className="dx-swarm-canvas" />
      {webglFail ? (
        <div className="dx-swarm-fallback" role="img" aria-label="2D swarm fallback">
          2D SWARM BOARD · DRX-01 · DRX-04 · DRX-07 · DRX-11 · <span className="dx-sim">SIMULATION</span>
        </div>
      ) : null}
      <div className="dx-swarm-hud">
        <span>FORMATION: ECHELON · ALT 42M · SIM TELEMETRY</span>
        <span>BATT 78% · LINK 92%</span>
      </div>
      {phase === "detected" ? (
        <div className="dx-detect" role="alert">
          <div className="dx-detect-title">◉ TARGET DETECTED <span className="dx-sim">SIMULATION</span></div>
          <div className="dx-detect-grid">
            <span>ID</span><b>{detection.id}</b>
            <span>COORDS</span><b>{detection.lat} · {detection.lon}</b>
            <span>CONFIDENCE</span><b>{detection.confidence}%</b>
            <span>DISTANCE</span><b>{detection.distanceM} m</b>
            <span>ETA</span><b>{detection.etaMin} min</b>
            <span>THERMAL</span><b className="text-amber-300">STRONG · 37.1°C</b>
          </div>
        </div>
      ) : phase === "analyze" ? (
        <div className="dx-scan-note dx-analyzing" role="status">
          ANALYZING THERMAL CONTACT<span className="dx-dots" aria-hidden="true"><i>•</i><i>•</i><i>•</i></span> <span className="dx-sim">SIMULATION</span>
        </div>
      ) : (
        <div className="dx-scan-note">SCANNING SAR GRID… FLIR ACTIVE <span className="dx-sim">SIMULATION</span></div>
      )}
    </div>
  );
}
