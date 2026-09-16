'use client';
/** Optional global→India→NE→state→district→slope globe (schematic, demo). */
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { setNESafe, useNESafe } from '@/nesafe/store/nesafeStore';

const LEVELS = ['🌍 GLOBAL', '🇮🇳 INDIA', 'NORTHEAST INDIA', 'STATE', 'DISTRICT', 'SLOPE'];

function Globe() {
  const ref = useRef<THREE.Mesh>(null);
  const arcs = useMemo(() => {
    const pts: THREE.Vector3[][] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const curve: THREE.Vector3[] = [];
      for (let t = 0; t <= 20; t++) {
        const th = a + (t / 20) * 0.9;
        const r = 2.02 + Math.sin((t / 20) * Math.PI) * 0.35;
        curve.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th * 1.3) * r * 0.4 + 0.4, Math.sin(th) * r));
      }
      pts.push(curve);
    }
    return pts;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.12;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2, 40, 40]} />
        <meshStandardMaterial color="#0a2540" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.02, 24, 24]} />
        <meshBasicMaterial color="#00d2ff" wireframe transparent opacity={0.12} />
      </mesh>
      {arcs.map((c, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(c.flatMap((v) => [v.x, v.y, v.z])), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={i === 2 ? '#ff5470' : '#00d2ff'} transparent opacity={0.7} />
        </line>
      ))}
      {/* NE-India marker */}
      <mesh position={[0.9, 0.75, 1.55]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ff5470" />
      </mesh>
    </group>
  );
}

export default function GlobeView() {
  const { globeLevel } = useNESafe();
  return (
    <div className="nesafe-glass" style={{ padding: 12 }}>
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>🌍 GLOBAL → SLOPE DRILL-DOWN (animated)</b>
        <span className="nesafe-chip">{LEVELS[globeLevel]}</span>
      </div>
      <div style={{ height: 260 }}>
        <Canvas camera={{ position: [0, 1.4, 5.4 - globeLevel * 0.35], fov: 48 }} dpr={1}>
          <ambientLight intensity={0.7} />
          <pointLight position={[4, 3, 4]} intensity={1} color="#00d2ff" />
          <Globe />
          <OrbitControls enableZoom enableRotate autoRotate={false} />
        </Canvas>
      </div>
      <div className="nesafe-row" style={{ flexWrap: 'wrap' }}>
        {LEVELS.map((l, i) => (
          <button key={l} onClick={() => setNESafe({ globeLevel: i })} className={i === globeLevel ? 'nesafe-btn-on' : ''} style={{ fontSize: 11 }}>
            {l}
          </button>
        ))}
      </div>
      <p className="nesafe-note">Camera eases between levels — schematic globe, not a survey projection.</p>
    </div>
  );
}
