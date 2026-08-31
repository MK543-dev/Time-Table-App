import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeProgressRingProps {
  completed: number;
  total: number;
  theme?: 'glass' | 'dark' | 'light';
}

export const ThreeProgressRing: React.FC<ThreeProgressRingProps> = ({
  completed,
  total,
  theme = 'glass',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const progressMeshRef = useRef<THREE.Mesh | null>(null);
  const trackMeshRef = useRef<THREE.Mesh | null>(null);
  const particleGroupRef = useRef<THREE.Points | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const reqIdRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const ratio = total > 0 ? Math.min(1, completed / total) : 0;

  // Immersive UI Glowing Cyan / Amber / Red color mappings
  const getGlowColor = (p: number) => {
    if (p >= 80) return new THREE.Color(0x22d3ee); // Cyan-400
    if (p >= 40) return new THREE.Color(0xf59e0b); // Amber-500
    return new THREE.Color(0xef4444); // Red-500
  };

  const getGlowColorHex = (p: number) => {
    if (p >= 80) return '#22d3ee';
    if (p >= 40) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 280;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x22d3ee, 0.9);
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(getGlowColor(percentage), 3.0, 14);
    pointLight.position.set(0, 0, 2);
    pointLightRef.current = pointLight;
    scene.add(pointLight);

    // Background track torus (subtle dark glass ring)
    const trackGeo = new THREE.TorusGeometry(2.3, 0.28, 24, 64, Math.PI * 2);
    const trackMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMeshRef.current = trackMesh;
    scene.add(trackMesh);

    // Dynamic progress torus arc
    const arcLength = Math.max(0.05, ratio * Math.PI * 2);
    const progressGeo = new THREE.TorusGeometry(2.3, 0.32, 32, 96, arcLength);
    const currentColor = getGlowColor(percentage);
    const progressMat = new THREE.MeshPhysicalMaterial({
      color: currentColor,
      emissive: currentColor,
      emissiveIntensity: 0.75,
      roughness: 0.1,
      metalness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const progressMesh = new THREE.Mesh(progressGeo, progressMat);
    progressMesh.rotation.z = Math.PI / 2; // start from top
    progressMeshRef.current = progressMesh;
    scene.add(progressMesh);

    // Floating particle dust field around the ring in cyan & accent colors
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.3 + (Math.random() - 0.5) * 1.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;

      colors[i * 3] = currentColor.r;
      colors[i * 3 + 1] = currentColor.g;
      colors[i * 3 + 2] = currentColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particleGroup = new THREE.Points(particleGeo, particleMat);
    particleGroupRef.current = particleGroup;
    scene.add(particleGroup);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (trackMesh) {
        trackMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.12;
        trackMesh.rotation.y = Math.cos(elapsedTime * 0.4) * 0.15;
      }

      if (progressMesh) {
        progressMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.12;
        progressMesh.rotation.y = Math.cos(elapsedTime * 0.4) * 0.15;
      }

      if (particleGroup) {
        particleGroup.rotation.z = elapsedTime * 0.1;
        particleGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      trackGeo.dispose();
      trackMat.dispose();
      progressGeo.dispose();
      progressMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  // Update Geometry & Color when completed / total changes
  useEffect(() => {
    if (!sceneRef.current || !progressMeshRef.current) return;

    const targetColor = getGlowColor(percentage);

    // Update progress arc geometry smoothly
    const arcLength = Math.max(0.05, ratio * Math.PI * 2);
    progressMeshRef.current.geometry.dispose();
    progressMeshRef.current.geometry = new THREE.TorusGeometry(2.3, 0.32, 32, 96, arcLength);

    // Update material color & glow
    const mat = progressMeshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.color = targetColor;
    mat.emissive = targetColor;
    mat.emissiveIntensity = percentage >= 80 ? 0.85 : percentage >= 40 ? 0.65 : 0.5;

    if (pointLightRef.current) {
      pointLightRef.current.color = targetColor;
    }

    // Update particle colors
    if (particleGroupRef.current) {
      const colors = particleGroupRef.current.geometry.attributes.color;
      if (colors) {
        const arr = colors.array as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] = targetColor.r;
          arr[i + 1] = targetColor.g;
          arr[i + 2] = targetColor.b;
        }
        colors.needsUpdate = true;
      }
    }
  }, [completed, total, percentage, ratio]);

  return (
    <div
      id="hero-3d-progress-ring-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex flex-col items-center justify-center p-6 rounded-2xl glass transition-all duration-300 shadow-2xl overflow-hidden group hover:border-cyan-500/30 glow-cyan"
    >
      {/* Dynamic ambient backdrop blur orb */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: getGlowColorHex(percentage) }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-900"
      />

      {/* Header Info */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ backgroundColor: getGlowColorHex(percentage) }} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Progress Velocity
          </span>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-mono font-semibold border"
          style={{
            backgroundColor: `${getGlowColorHex(percentage)}15`,
            borderColor: `${getGlowColorHex(percentage)}40`,
            color: getGlowColorHex(percentage),
          }}
        >
          {percentage >= 100 ? 'All Completed' : percentage >= 80 ? 'Optimal Flow' : percentage >= 40 ? 'In Progress' : 'Kickoff'}
        </span>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Central Overlay HUD Stat */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-0.5">Tasks Today</span>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-baseline gap-1">
            <span className="text-cyan-400">{completed}</span>
            <span className="text-xl sm:text-2xl text-slate-500 font-normal">/ {total}</span>
          </div>
          <div
            className="text-xs font-semibold mt-1 tracking-wide font-mono"
            style={{ color: getGlowColorHex(percentage) }}
          >
            {percentage}% Completed
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {total - completed > 0 ? `${total - completed} blocks remaining` : 'Daily target achieved'}
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-white/5 z-10 text-center">
        <div className="p-2.5 rounded-xl glass-dark">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Done</div>
          <div className="text-sm font-bold font-mono text-green-400">{completed}</div>
        </div>
        <div className="p-2.5 rounded-xl glass-dark">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pending</div>
          <div className="text-sm font-bold font-mono text-amber-400">{Math.max(0, total - completed)}</div>
        </div>
        <div className="p-2.5 rounded-xl glass-dark">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Efficiency</div>
          <div className="text-sm font-bold font-mono text-cyan-300">{percentage}%</div>
        </div>
      </div>
    </div>
  );
};
