"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function DigitalTwin({ alt = 120 }: { alt?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const w = ref.current.clientWidth || 320;
    const h = 280;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    cam.position.set(3, 2.5, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    ref.current.innerHTML = "";
    ref.current.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(10, 20, 0x00ffff, 0x0a3a55);
    scene.add(grid);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0aa4c4 })
    );
    scene.add(body);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 8, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x335566));

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      body.rotation.y += 0.01;
      body.position.y = (alt % 50) / 25 - 1; // bob with telemetry
      renderer.render(scene, cam);
    };
    animate();

    const onResize = () => {
      const nw = ref.current?.clientWidth || w;
      renderer.setSize(nw, h);
      cam.aspect = nw / h;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [alt]);

  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}
