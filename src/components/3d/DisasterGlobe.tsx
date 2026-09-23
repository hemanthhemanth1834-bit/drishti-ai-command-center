'use client';
/**
 * DRISHTI-X DisasterGlobe (adapted from the Open Design `DisasterGlobe.js`
 * reference into this repo's React-Three-Fiber 8 setup).
 *
 * Shows India + disaster hotspots + incident signals + atmosphere +
 * data-connection arcs. Used on landing/intelligence/optional command views.
 *
 * Accessibility/performance: reduced-motion disables rotation, quality
 * control + performance mode lower pixel ratio/geometry, and a 2D fallback
 * list renders when WebGL is unavailable or the user prefers it.
 */
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StatusBadge } from '@/platform/provenance';
import { DEMO_INCIDENTS } from '@/data/operational';

/** Hotspot positions on a unit globe (schematic — not a survey projection). */
const HOTSPOTS = [
  { id: 'HYD', label: 'Hyderabad / Krishna Basin — Flood watch (DEMO)', pos: [0.9, 0.62, 1.55] as const, color: '#fb923c' },
  { id: 'WAY', label: 'Wayanad — Landslide risk (DEMO)', pos: [0.55, 0.35, 1.75] as const, color: '#ff5470' },
  { id: 'ODI', label: 'Odisha Coast — Cyclone watch (DEMO)', pos: [1.25, 0.72, 1.3] as const, color: '#fbbf24' },
  { id: 'NER', label: 'Northeast Ridge — Fire report UNVERIFIED (DEMO)', pos: [1.55, 0.95, 0.75] as const, color: '#fbbf24' },
  { id: 'DEL', label: 'Delhi NCR — Heat advisory (DEMO)', pos: [0.75, 1.05, 1.45] as const, color: '#00d2ff' },
];

function Arcs({ animated }: { animated: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const curves = useMemo(() => {
    const out: THREE.Vector3[][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= 20; t++) {
        const th = a + (t / 20) * 0.8;
        const r = 2.04 + Math.sin((t / 20) * Math.PI) * 0.3;
        pts.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th * 1.2) * r * 0.4 + 0.35, Math.sin(th) * r));
      }
      out.push(pts);
    }
    return out;
  }, []);
  useFrame(({ clock }) => {
    if (animated && ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.1;
  });
  return (
    <group ref={ref}>
      {curves.map((c, i) => (
        // eslint-disable-next-line react/no-unknown-property
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(c.flatMap((v) => [v.x, v.y, v.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={i === 1 ? '#ff5470' : '#00d2ff'} transparent opacity={0.65} />
        </line>
      ))}
    </group>
  );
}

function Earth({ animated, detail }: { animated: boolean; detail: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (animated && ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.08;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2, detail, detail]} />
        <meshStandardMaterial color="#0a2540" roughness={0.85} metalness={0.15} />
      </mesh>
      {/* atmosphere shell */}
      <mesh>
        <sphereGeometry args={[2.08, 24, 24]} />
        <meshBasicMaterial color="#00d2ff" wireframe transparent opacity={0.1} />
      </mesh>
      {HOTSPOTS.map((h) => (
        <mesh key={h.id} position={[h.pos[0], h.pos[1], h.pos[2]]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={h.color} />
        </mesh>
      ))}
    </group>
  );
}

export default function DisasterGlobe({ height = 340 }: { height?: number }) {
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [fallback2d, setFallback2d] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animated = !reducedMotion && quality === 'high';
  const show2d = fallback2d || failed;

  return (
    <section className="dx-hud" aria-label="DRISHTI-X 3D disaster globe">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">3D · INDIA + HOTSPOTS (SCHEMATIC)</div>
          <div className="dx-hud-title">Disaster Globe</div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <StatusBadge status="DEMO" small />
          <label className="text-[10px] text-slate-400 flex items-center gap-1">
            Quality
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as 'high' | 'low')}
              className="bg-[#020b14] border border-[#1b314b] rounded px-1.5 py-1 text-slate-200"
              aria-label="Globe render quality"
            >
              <option value="high">High</option>
              <option value="low">Performance</option>
            </select>
          </label>
          <button
            onClick={() => setFallback2d((v) => !v)}
            className="text-[10px] px-2 py-1"
            aria-pressed={fallback2d}
          >
            {fallback2d ? 'Show 3D' : '2D fallback'}
          </button>
        </div>
      </div>

      {show2d || reducedMotion === true && fallback2d ? (
        <ul className="text-xs text-slate-300 space-y-1.5" aria-label="Hotspot list (2D fallback)">
          {HOTSPOTS.map((h) => (
            <li key={h.id} className="bg-[#091a2e] border border-[#1b314b] rounded-lg px-3 py-2">
              <span style={{ color: h.color }}>■</span> {h.label}
            </li>
          ))}
          <li className="text-[10px] text-slate-500">2D fallback — same signals, no WebGL. Schematic positions, DEMO data.</li>
        </ul>
      ) : (
        <div style={{ height }} className="rounded-xl overflow-hidden border border-[#1b314b] bg-[#020b14]">
          <Canvas
            camera={{ position: [0, 1.2, 5.6], fov: 46 }}
            dpr={quality === 'high' ? [1, 2] : [1, 1]}
            onCreated={({ gl }) => {
              try {
                gl.getContext();
              } catch {
                setFailed(true);
              }
            }}
          >
            <ambientLight intensity={0.75} />
            <pointLight position={[4, 3, 4]} intensity={1} color="#00d2ff" />
            <Earth animated={animated} detail={quality === 'high' ? 40 : 20} />
            <Arcs animated={animated} />
            <OrbitControls enableZoom enableRotate autoRotate={false} />
          </Canvas>
        </div>
      )}
      {!show2d && (
        <ul className="sr-only">
          {DEMO_INCIDENTS.map((d) => (
            <li key={d.id}>{d.type} {d.severity} at {d.place}</li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-slate-500 mt-2">
        Schematic globe — hotspot positions illustrative, incident rows DEMO. Rotation {animated ? 'on' : 'off (reduced-motion / performance mode)'}.
      </p>
    </section>
  );
}
