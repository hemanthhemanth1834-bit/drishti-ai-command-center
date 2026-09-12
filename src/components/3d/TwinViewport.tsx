"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type TwinEntity = { id: string; label: string; kind: string };

const ENTITIES: (TwinEntity & { pos: [number, number, number]; color: number })[] = [
  { id: "RB-07", label: "NDRF Boat RB-07", kind: "boat", pos: [-2.5, 0.1, 1.5], color: 0x34d399 },
  { id: "AMB-12", label: "Ambulance AMB-12", kind: "ground", pos: [2.2, 0.1, -1.8], color: 0xfbbf24 },
  { id: "DRX-07", label: "Drone DRX-07", kind: "air", pos: [0, 1.5, 0], color: 0x00d2ff },
];

type Props = {
  alt?: number;
  surgeM?: number;
  spotlight?: boolean;
  height?: number;
  dropFlash?: number;
  onSelect?: (e: TwinEntity | null) => void;
};

/** Full-viewport WebGL twin: terrain grid, surge plane, spotlight cone, pickable entities. */
export default function TwinViewport({
  alt = 120,
  surgeM = 0,
  spotlight = true,
  height = 460,
  dropFlash = 0,
  onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ alt, surgeM, spotlight, dropFlash });
  live.current = { alt, surgeM, spotlight, dropFlash };
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

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
    const terrain = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x0a2036, roughness: 0.9 })
    );
    terrain.position.y = -0.15;
    scene.add(terrain);

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
    const onPick = (ev: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, cam);
      const hit = ray.intersectObjects(pickables, false)[0];
      selectRef.current?.((hit?.object.userData.entity as TwinEntity) ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", onPick);

    let raf = 0;
    let t = 0;
    let lastFlash = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      const s = live.current;
      // Drone bobs with live telemetry altitude
      drone.position.y = 1.2 + ((s.alt % 50) / 25) * 0.8 + Math.sin(t * 1.4) * 0.08;
      drone.rotation.y += 0.004;
      cone.visible = s.spotlight;
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
      renderer.dispose();
    };
  }, [height]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
