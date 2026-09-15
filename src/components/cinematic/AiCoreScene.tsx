"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useApp } from "@/store/appStore";
import { soundSynth } from "@/utils/audioSynth";

type Props = {
  /** compact height in px */
  height?: number;
  /** threat tone drives core color: ok | warn | critical */
  tone?: "ok" | "warn" | "critical";
  className?: string;
  label?: string;
};

const TONE_COLOR: Record<string, number> = {
  ok: 0x00d2ff,
  warn: 0xffb020,
  critical: 0xff5470,
};

/**
 * DRISHTI-X AI CORE — glowing energy sphere + orbital rings + neural nodes
 * + particle shell + scanning waves. Vanilla Three.js, procedural only.
 * Adaptive (qualityMode: low/medium/high), interactive click-drag rotation,
 * parks when offscreen/hidden, full CSS fallback when WebGL or reduced-motion is unavailable.
 */
export default function AiCoreScene({ height = 220, tone = "ok", className = "", label = "DRISHTI-X AI core visualization" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { qualityMode } = useApp();
  const qualityRef = useRef(qualityMode);
  qualityRef.current = qualityMode;
  const toneRef = useRef(tone);
  toneRef.current = tone;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // CSS fallback core stays visible

    const isLow = qualityRef.current === "low";
    const isHigh = qualityRef.current === "high";
    const weak = isLow || /Mobi|Android/i.test(navigator.userAgent) || (navigator.hardwareConcurrency ?? 8) <= 4;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !weak, alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    const w = mount.clientWidth || 320;
    const h = height;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, weak ? 1 : 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020b14, 0.06);
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 60);
    cam.position.set(0, 0.4, 6.4);

    scene.add(new THREE.AmbientLight(0x4a7a9a, 1.0));
    const key = new THREE.DirectionalLight(0x9beaff, 1.6);
    key.position.set(4, 3, 5);
    scene.add(key);
    // volumetric-feel core illumination: warm key from front, cool fill from below
    const coreLight = new THREE.PointLight(TONE_COLOR[toneRef.current] ?? 0x00d2ff, 18, 20);
    coreLight.position.set(0, 0, 1.2);
    scene.add(coreLight);
    const fill = new THREE.PointLight(0x2f7bff, 6, 16);
    fill.position.set(0, -2.2, 2.4);
    scene.add(fill);
    const backRim = new THREE.PointLight(0x9beaff, 5, 18);
    backRim.position.set(-2.5, 1.5, -2.5);
    scene.add(backRim);

    const core = new THREE.Group();
    scene.add(core);

    // --- energy core: icosahedron with emissive pulse ---
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06283d,
      emissive: TONE_COLOR[toneRef.current] ?? 0x00d2ff,
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.96,
    });
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 2), coreMat);
    core.add(coreMesh);

    // wireframe shell — neural lattice feel
    const lattice = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 2),
      new THREE.MeshBasicMaterial({ color: 0x9beaff, wireframe: true, transparent: true, opacity: 0.16 })
    );
    core.add(lattice);

    // inner energy pulse — small bright kernel that breathes (controlled, alive)
    const pulseMat = new THREE.MeshBasicMaterial({
      color: TONE_COLOR[toneRef.current] ?? 0x00d2ff,
      transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), pulseMat);
    core.add(pulse);

    // fresnel glow shell (additive, BackSide)
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.32, 32, 24),
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: { c: { value: new THREE.Color(TONE_COLOR[toneRef.current] ?? 0x00d2ff) } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float rim = pow(1.0 - abs(vN.z), 2.4); gl_FragColor = vec4(c, rim * 0.6); }`,
      })
    );
    core.add(glow);

    // --- orbital rings ---
    const rings: THREE.Mesh[] = [];
    const ringDefs = [
      { r: 1.75, tube: 0.008, op: 0.5, tiltX: Math.PI / 2.2, tiltY: 0.2, speed: 0.5 },
      { r: 2.15, tube: 0.006, op: 0.32, tiltX: Math.PI / 1.7, tiltY: -0.4, speed: -0.34 },
      { r: 2.55, tube: 0.005, op: 0.2, tiltX: Math.PI / 2.5, tiltY: 0.7, speed: 0.22 },
    ];
    const ringMats: THREE.MeshBasicMaterial[] = [];
    ringDefs.forEach((d) => {
      const rm = new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: d.op });
      ringMats.push(rm);
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, d.tube, 6, 128),
        rm
      );
      m.rotation.x = d.tiltX;
      m.rotation.y = d.tiltY;
      m.userData.speed = d.speed;
      scene.add(m);
      rings.push(m);
    });

    // --- orbiting data nodes + neural links to core ---
    const NODES = isLow ? 4 : isHigh ? 12 : 8;
    const nodeGeo = new THREE.OctahedronGeometry(0.07);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xbfefff });
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < NODES; i++) {
      const n = new THREE.Mesh(nodeGeo, nodeMat);
      scene.add(n);
      nodes.push(n);
    }
    const linkGeo = new THREE.BufferGeometry();
    const linkPos = new Float32Array(NODES * 2 * 3);
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
    const links = new THREE.LineSegments(
      linkGeo,
      new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.35 })
    );
    scene.add(links);

    // --- particle shell (atmosphere motes) ---
    const P = isLow ? 70 : isHigh ? 450 : 240;
    const pos = new Float32Array(P * 3);
    const seed: number[] = [];
    for (let i = 0; i < P; i++) {
      const r = 2.2 + Math.random() * 2.4;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      seed.push(Math.random() * Math.PI * 2);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x5fd8ff, size: 0.035, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    scene.add(dust);

    // --- scanning wave rings expanding from core ---
    const waves: { mesh: THREE.Mesh; t: number }[] = [];
    const waveGeo = new THREE.TorusGeometry(1, 0.012, 6, 96);
    for (let i = 0; i < 2; i++) {
      const wm = new THREE.Mesh(
        waveGeo,
        new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
      );
      wm.rotation.x = Math.PI / 2;
      scene.add(wm);
      waves.push({ mesh: wm, t: i * 0.5 });
    }

    // --- holographic grid floor ---
    const grid = new THREE.GridHelper(14, 24, 0x1fb6d5, 0x0b2f47);
    grid.position.y = -2.4;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.28;
    scene.add(grid);

    const mouse = { x: 0, y: 0 };
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      soundSynth.radarPing(1480, 0.02);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onMouse = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;

      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        dragVelocityX = deltaX * 0.008;
        dragVelocityY = deltaY * 0.008;
      }
    };

    mount.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onMouse, { passive: true });

    const onResize = () => {
      const nw = mount.clientWidth || 320;
      renderer?.setSize(nw, height);
      cam.aspect = nw / height;
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
    io.observe(mount);
    const onVis = () => {
      pageVisible = !document.hidden;
      clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVis);

    const target = new THREE.Color(TONE_COLOR[toneRef.current] ?? 0x00d2ff);
    const ringTarget = new THREE.Color(0x38e1ff);
    const coolTint = new THREE.Color(0x9beaff);
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || !pageVisible) return;
      const dt = Math.min(0.05, clock.getDelta());
      t += dt;

      // smooth cinematic tone transitions (lerp toward target, no snapping)
      target.setHex(TONE_COLOR[toneRef.current] ?? 0x00d2ff);
      ringTarget.copy(target).lerp(coolTint, 0.45);
      const k = 1 - Math.exp(-dt * 3.2);
      coreMat.emissive.lerp(target, k);
      (glow.material as THREE.ShaderMaterial).uniforms.c.value.lerp(target, k);
      coreLight.color.lerp(target, k);
      (links.material as THREE.LineBasicMaterial).color.lerp(target, k);
      pulseMat.color.lerp(target, k);
      ringMats.forEach((rm) => rm.color.lerp(ringTarget, k * 0.5));
      // localized light follows tone energy (soft bloom feel, no post pass)
      const energy = 0.5 + Math.sin(t * 2.1) * 0.18;
      coreMat.emissiveIntensity = energy;
      coreLight.intensity = 16 + Math.sin(t * 2.1) * 4;
      pulseMat.opacity = 0.65 + Math.sin(t * 2.1) * 0.2;

      coreMesh.rotation.y += dt * 0.35 + dragVelocityX;
      coreMesh.rotation.x = Math.sin(t * 0.3) * 0.15 + dragVelocityY;
      dragVelocityX *= 0.93;
      dragVelocityY *= 0.93;
      // controlled breathing: core + pulse feel alive, never exaggerated
      const breathe = 1 + Math.sin(t * 1.6) * 0.022;
      coreMesh.scale.set(breathe, breathe, breathe);
      const ps = 1 + Math.sin(t * 2.1) * 0.12;
      pulse.scale.set(ps, ps, ps);
      lattice.rotation.y -= dt * 0.22;
      lattice.rotation.z += dt * 0.08;
      rings.forEach((r) => {
        r.rotation.z += dt * (r.userData.speed as number);
      });

      // nodes orbit on tilted shells, links stretch node→core
      const lp = linkGeo.attributes.position as THREE.BufferAttribute;
      const la = lp.array as Float32Array;
      nodes.forEach((n, i) => {
        const shell = 1.9 + (i % 3) * 0.35;
        const sp = 0.35 + (i % 4) * 0.08;
        const a = t * sp + (i * Math.PI * 2) / NODES;
        const y = Math.sin(t * 0.6 + i * 1.7) * 0.9;
        n.position.set(Math.cos(a) * shell, y, Math.sin(a) * shell);
        la[i * 6] = n.position.x;
        la[i * 6 + 1] = n.position.y;
        la[i * 6 + 2] = n.position.z;
        la[i * 6 + 3] = 0;
        la[i * 6 + 4] = 0;
        la[i * 6 + 5] = 0;
        const s = 0.85 + Math.sin(t * 3 + i) * 0.25;
        n.scale.set(s, s, s);
      });
      lp.needsUpdate = true;

      // scanning waves: expand + fade loop
      waves.forEach((wv) => {
        wv.t += dt * 0.45;
        if (wv.t > 1) wv.t = 0;
        const s = 1.1 + wv.t * 1.9;
        wv.mesh.scale.set(s, s, s);
        (wv.mesh.material as THREE.MeshBasicMaterial).opacity = 0.42 * (1 - wv.t);
        wv.mesh.position.y = -0.4 + wv.t * 0.8;
      });

      dust.rotation.y += dt * 0.03;
      const dp = dust.geometry.attributes.position as THREE.BufferAttribute;
      const arr = dp.array as Float32Array;
      for (let i = 0; i < dp.count; i++) {
        arr[i * 3 + 1] += Math.sin(t + seed[i]) * dt * 0.05;
      }
      dp.needsUpdate = true;

      cam.position.x += (mouse.x * 0.7 - cam.position.x) * 0.04;
      cam.position.y += (0.4 - mouse.y * 0.4 - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);
      renderer?.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mount.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onMouse);
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
  }, [height]);

  return (
    <div className={`dx-aicore ${className}`} role="img" aria-label={label}>
      <div ref={mountRef} className="dx-aicore-canvas" style={{ height }} />
      {/* CSS fallback core: visible when WebGL/reduced-motion parks the canvas */}
      <div className="dx-aicore-fallback" aria-hidden="true">
        <div className={`dx-aicore-orb dx-aicore-${tone}`} />
        <div className="dx-aicore-ring dx-aicore-ring-a" />
        <div className="dx-aicore-ring dx-aicore-ring-b" />
      </div>
      <div className="dx-aicore-scan" aria-hidden="true" />
      <div className="dx-aicore-vignette" aria-hidden="true" />
      <div className="dx-aicore-tag" aria-hidden="true">
        <span className="dx-aicore-tag-title">DRISHTI-X AI CORE</span>
        <span className={`dx-aicore-tag-status dx-aicore-tag-${tone}`}>
          <i className="dx-aicore-tag-dot" />STATUS: ONLINE
        </span>
      </div>
    </div>
  );
}
