'use client';
/**
 * NE-SAFE 3D terrain — React Three Fiber declarative Three.js.
 * Cinematic terrain: elevation, fog, lighting, contour wireframe,
 * risk heat blobs (pulsing critical), animated sensor nodes, rain particles.
 * Falls back to 2D gradient if WebGL unavailable / reduced motion.
 */
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNESafe } from '@/nesafe/store/nesafeStore';
import { NE_SLOPES, NE_SENSORS } from '@/nesafe/data/northeast';
import type { RiskLevel } from '@/nesafe/providers/types';

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#34d399', moderate: '#fbbf24', high: '#fb923c', critical: '#ff5470',
};

function heightAt(x: number, z: number): number {
  // Procedural DEM: hills + ridge + valley (demo, not survey data)
  return (
    Math.sin(x * 0.55) * Math.cos(z * 0.5) * 1.1 +
    Math.sin(x * 0.22 + 1.3) * 1.6 +
    Math.cos(z * 0.3 - 0.6) * 0.9 -
    Math.exp(-(x * x + z * z) / 9) * 1.2
  );
}

function TerrainMesh({ exaggeration }: { exaggeration: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(16, 16, 72, 72);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const z = pos.getZ(i);
      pos.setY(i, heightAt(x, z) * exaggeration);
    }
    g.computeVertexNormals();
    return g;
  }, [exaggeration]);
  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial color="#1d3a2f" roughness={0.95} metalness={0.05} flatShading={false} />
    </mesh>
  );
}

function ContourMesh({ exaggeration }: { exaggeration: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(16, 16, 36, 36);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const z = pos.getZ(i);
      pos.setY(i, heightAt(x, z) * exaggeration + 0.02);
    }
    return g;
  }, [exaggeration]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#00d2ff" wireframe transparent opacity={0.14} />
    </mesh>
  );
}

function slopeToXZ(lat: number, lon: number, i: number): [number, number] {
  // Schematic projection for demo terrain (not geographic projection)
  const x = ((lon - 91.8) / 2.4) * 12 + (i % 3) * 0.4;
  const z = ((lat - 25.6) / 2.6) * -12 + (i % 2) * 0.5;
  return [Math.max(-7, Math.min(7, x)), Math.max(-7, Math.min(7, z))];
}

function RiskBlobs() {
  const { sim } = useNESafe();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m) => {
      if (!m) return;
      const crit = (m.userData as { critical?: boolean }).critical;
      const s = crit ? 1 + Math.sin(t * 2.4) * 0.08 : 1;
      m.scale.set(s, 1, s);
      const mat = m.material as THREE.MeshBasicMaterial;
      if (crit) mat.opacity = 0.5 + Math.sin(t * 2.4) * 0.12;
    });
  });
  return (
    <group>
      {NE_SLOPES.slice(0, 8).map((s, i) => {
        const st = sim[s.id];
        const level = st?.level ?? 'low';
        const [x, z] = slopeToXZ(s.lat, s.lon, i);
        const y = heightAt(x, z) * 1.15 + 0.12;
        const critical = level === 'critical';
        return (
          <mesh
            key={s.id}
            position={[x, y, z]}
            ref={(m) => { refs.current[i] = m; if (m) m.userData = { critical }; }}
          >
            <cylinderGeometry args={[0.9 - i * 0.04, 1.1, 0.22, 24]} />
            <meshBasicMaterial color={RISK_COLOR[level]} transparent opacity={critical ? 0.55 : 0.38} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function SensorNodes({ onPick }: { onPick: (id: string) => void }) {
  const { sim } = useNESafe();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    rings.current.forEach((m, i) => {
      if (!m) return;
      const s = 1 + ((t * 0.7 + i * 0.6) % 1) * 0.9;
      m.scale.set(s, s, s);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - ((t * 0.7 + i * 0.6) % 1));
    });
  });
  return (
    <group>
      {NE_SENSORS.slice(0, 7).map((sn, i) => {
        const st = sim[sn.slopeId];
        const level = st?.level ?? 'low';
        const [x, z] = slopeToXZ(sn.lat, sn.lon, i + 2);
        const y = heightAt(x, z) * 1.15;
        return (
          <group key={sn.id} position={[x, y, z]}>
            {/* mast */}
            <mesh position={[0, 0.55, 0]} onClick={() => onPick(sn.id)}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
              <meshStandardMaterial color="#7de9ff" emissive="#00d2ff" emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[0, 1.15, 0]} onClick={() => onPick(sn.id)}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color={RISK_COLOR[level]} emissive={RISK_COLOR[level]} emissiveIntensity={1.2} />
            </mesh>
            <mesh ref={(m) => { rings.current[i] = m; }} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.28, 0.36, 28]} />
              <meshBasicMaterial color={RISK_COLOR[level]} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function RainParticles({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = Math.round(120 + intensity * 9); // reduced on mobile via parent
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      speeds[i] = 2.5 + Math.random() * 3;
    }
    return { positions, speeds };
  }, [count]);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const d = Math.min(dt, 0.05);
    const pos = (m.geometry.attributes.position as THREE.BufferAttribute);
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - speeds[i] * d * (0.6 + intensity / 60);
      if (y < -1) y = 8;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  if (intensity < 6) return null;
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#7de9ff" size={0.045} transparent opacity={Math.min(0.85, 0.3 + intensity / 90)} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Terrain3D({ onPickSensor }: { onPickSensor: (id: string) => void }) {
  const { sim, selectedSlopeId } = useNESafe();
  const [failed, setFailed] = useState(false);
  const [lowQ, setLowQ] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        setLowQ(mobile || (navigator.hardwareConcurrency ?? 4) <= 4);
      }
    } catch { /* noop */ }
  }, []);
  const focus = sim[selectedSlopeId];
  const rain = focus?.rainfallMmHr ?? 20;
  if (failed) {
    return (
      <div className="nesafe-fallback" role="img" aria-label="2D terrain fallback">
        <div className="nesafe-fallback-hills" />
        <p>2D FALLBACK · WebGL unavailable — map + risk list remain usable</p>
      </div>
    );
  }
  return (
    <div className="nesafe-canvas-wrap" style={{ height: 420 }}>
      <Canvas
        camera={{ position: [9, 8, 11], fov: 50 }}
        dpr={lowQ ? 1 : [1, 1.75]}
        gl={{ antialias: !lowQ, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          try { gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setFailed(true); }); } catch { /* noop */ }
        }}
        onError={() => setFailed(true)}
      >
        <color attach="background" args={['#04121f']} />
        <fog attach="fog" args={['#04121f', 14, 30]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 10, 4]} intensity={1.15} castShadow={false} color="#fff4e0" />
        <pointLight position={[-6, 4, -4]} intensity={0.7} color="#00d2ff" />
        <TerrainMesh exaggeration={1.15} />
        <ContourMesh exaggeration={1.15} />
        <RiskBlobs />
        <SensorNodes onPick={onPickSensor} />
        <RainParticles intensity={lowQ ? rain * 0.5 : rain} />
        {/* command-center uplink beam */}
        <mesh position={[0, 4.4, 0]}>
          <cylinderGeometry args={[0.05, 0.35, 7, 12, 1, true]} />
          <meshBasicMaterial color="#00d2ff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <OrbitControls enablePan enableZoom enableRotate autoRotate={false} maxPolarAngle={Math.PI / 2.15} minDistance={5} maxDistance={26} />
      </Canvas>
      {rain > 70 && <div className="nesafe-extreme">EXTREME RAIN · dense rain + fog overlay (simulated)</div>}
    </div>
  );
}
