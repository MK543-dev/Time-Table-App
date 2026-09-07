import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Torus, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ProgressTorus({ percentage, size = 120 }) {
  const meshRef = useRef()
  const radius = size / 55
  const tube = size / 220

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  // Color shifts red → amber → green based on percentage
  const getColor = (pct) => {
    if (pct < 33) return '#ef4444'     // red
    if (pct < 66) return '#f59e0b'     // amber
    return '#22c55e'                   // green
  }

  const color = getColor(percentage)
  // Arc geometry: fraction of full circle
  const arcAngle = (percentage / 100) * Math.PI * 2

  return (
    <group>
      {/* Outer glow ring */}
      <Torus args={[radius + 0.02, tube + 0.03, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </Torus>
      {/* Main progress torus */}
      <Torus ref={meshRef} args={[radius, tube, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <MeshDistortMaterial
          color={color}
          distort={0.05}
          speed={1.5}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.9}
        />
      </Torus>
      {/* Inner ring (static) */}
      <Torus args={[radius, tube * 0.3, 12, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#1e293b" transparent opacity={0.8} />
      </Torus>
    </group>
  )
}

export default function ProgressRing3D({ percentage = 0, size = 140 }) {
  return (
    <div style={{ width: size, height: size }} className="animate-float">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#4d73ff" />
        <pointLight position={[-3, -3, 2]} intensity={0.5} color="#22c55e" />
        <ProgressTorus percentage={percentage} size={size} />
      </Canvas>
    </div>
  )
}
