"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useApp } from "@/store/appStore";

type Props = {
  alt?: number;
  surgeM?: number;
  height?: number;
  interactive?: boolean;
};

/**
 * DRISHTI-X 3D SPATIAL DIGITAL TWIN
 * Procedural elevation terrain, river canyon, dynamic water inundation plane,
 * detailed quadcopter drone model with spinning rotors, and downward volumetric searchlight.
 */
export default function DigitalTwin({
  alt = 120,
  surgeM = 0,
  height = 280,
  interactive = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { qualityMode } = useApp();
  const qualityRef = useRef(qualityMode);
  qualityRef.current = qualityMode;

  const liveRef = useRef({ alt, surgeM });
  liveRef.current = { alt, surgeM };

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const isLow = qualityRef.current === "low" || reducedMotion;

    const w = mount.clientWidth || 320;
    const h = height;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isLow,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLow ? 1 : 1.75));
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020b14, 0.05);

    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cam.position.set(4.5, 3.8, 5.5);
    cam.lookAt(0, 0.2, 0);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0x224466, 1.2));
    const sun = new THREE.DirectionalLight(0x9beaff, 1.8);
    sun.position.set(6, 9, 5);
    scene.add(sun);

    const rimLight = new THREE.PointLight(0x00d2ff, 10, 20);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    // --- Procedural Elevation Terrain (DEM Mesh) ---
    const gridRes = isLow ? 24 : 48;
    const terrainGeo = new THREE.PlaneGeometry(8, 8, gridRes, gridRes);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      // Realistic terrain formula: broad hills + river bed cut + elevation variation
      const hill = Math.sin(v.x * 0.8) * Math.cos(v.z * 0.8) * 0.6;
      const river = -Math.exp(-Math.pow(v.x - 0.4, 2) / 0.8) * 0.75;
      const ridge = Math.sin(v.x * 1.8 + v.z * 1.2) * 0.22;
      const heightVal = hill + river + ridge;
      posAttr.setY(i, heightVal);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x071e33,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: false,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrain);

    // Topographic contour grid overlay
    const contourMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const contour = new THREE.Mesh(terrainGeo, contourMat);
    scene.add(contour);

    // Floor tactical coordinate grid
    const floorGrid = new THREE.GridHelper(10, 16, 0x00d2ff, 0x08253d);
    floorGrid.position.y = -1.2;
    (floorGrid.material as THREE.Material).transparent = true;
    (floorGrid.material as THREE.Material).opacity = 0.35;
    scene.add(floorGrid);

    // --- Dynamic Flood Water Plane ---
    const waterGeo = new THREE.PlaneGeometry(7.8, 7.8, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00a8ff,
      emissive: 0x004477,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -0.45;
    scene.add(water);

    // --- High-Tech Quadcopter Drone Model ---
    const drone = new THREE.Group();
    scene.add(drone);

    // Central chassis
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.12, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0c273e,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x003355,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    drone.add(body);

    // Top dome / GPS antenna
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.9 })
    );
    dome.position.y = 0.1;
    drone.add(dome);

    // 4 Diagonal Motor Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x031422, metalness: 0.9 });
    const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8);
    armGeo.rotateZ(Math.PI / 2);

    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.rotation.y = Math.PI / 4;
    drone.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, armMat);
    arm2.rotation.y = -Math.PI / 4;
    drone.add(arm2);

    // 4 Rotors with spinning blades
    const rotors: THREE.Mesh[] = [];
    const rotorOffsets = [
      { x: 0.32, z: 0.32 },
      { x: -0.32, z: 0.32 },
      { x: 0.32, z: -0.32 },
      { x: -0.32, z: -0.32 },
    ];
    const bladeGeo = new THREE.BoxGeometry(0.38, 0.01, 0.035);
    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.75,
    });

    rotorOffsets.forEach((pos) => {
      // Motor nacelle
      const nacelle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8),
        armMat
      );
      nacelle.position.set(pos.x, 0.04, pos.z);
      drone.add(nacelle);

      // Rotor blade
      const rotor = new THREE.Mesh(bladeGeo, bladeMat);
      rotor.position.set(pos.x, 0.09, pos.z);
      drone.add(rotor);
      rotors.push(rotor);
    });

    // Volumetric Downward Searchlight Cone
    const coneGeo = new THREE.ConeGeometry(0.8, 2.2, 16, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const searchlight = new THREE.Mesh(coneGeo, coneMat);
    searchlight.position.y = -1.1;
    drone.add(searchlight);

    // Status beacon LED under belly
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    beacon.position.y = -0.07;
    drone.add(beacon);

    // Pointer parallax
    const mouse = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    mount.addEventListener("pointermove", onPointerMove);

    // Responsive resize
    const onResize = () => {
      const nw = mount.clientWidth || w;
      renderer?.setSize(nw, height);
      cam.aspect = nw / height;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let t = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      t += dt;

      // Spin rotors
      const spinSpeed = isLow ? 15 : 32;
      rotors.forEach((r, idx) => {
        r.rotation.y += dt * spinSpeed * (idx % 2 === 0 ? 1 : -1);
      });

      // Drone flight dynamics: altitude bobbing + gentle pitch & roll
      const targetY = 1.3 + Math.sin(t * 1.8) * 0.12;
      drone.position.y = targetY;
      drone.position.x = Math.sin(t * 0.7) * 0.4;
      drone.position.z = Math.cos(t * 0.5) * 0.3;

      drone.rotation.z = -Math.cos(t * 0.7) * 0.06;
      drone.rotation.x = Math.sin(t * 0.5) * 0.05;

      // Flood water surge rise based on props
      const targetWaterY = -0.45 + (liveRef.current.surgeM || 0) * 0.15;
      water.position.y += (targetWaterY - water.position.y) * 0.05;

      // Water subtle ripple pulse
      waterMat.emissiveIntensity = 0.35 + Math.sin(t * 2.4) * 0.1;

      // Searchlight cone pulse
      coneMat.opacity = 0.14 + Math.sin(t * 3.2) * 0.05;

      // Status beacon blink (green/cyan)
      const beaconOn = Math.sin(t * 4.0) > 0;
      (beacon.material as THREE.MeshBasicMaterial).color.setHex(
        beaconOn ? 0x00ff88 : 0x004422
      );

      // Camera parallax with smooth damping
      const camTargetX = 4.5 + mouse.x * 1.2;
      const camTargetY = 3.8 - mouse.y * 0.8;
      cam.position.x += (camTargetX - cam.position.x) * 0.04;
      cam.position.y += (camTargetY - cam.position.y) * 0.04;
      cam.lookAt(0, 0.2, 0);

      renderer?.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer?.dispose();
      if (renderer?.domElement) {
        renderer.domElement.remove();
      }
      renderer = null;
    };
  }, [height, interactive]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height }}
      className="relative overflow-hidden cursor-crosshair rounded-lg bg-[#020b14]"
      role="img"
      aria-label="3D digital elevation twin showing terrain contours, drone position, and flood water levels"
    />
  );
}
