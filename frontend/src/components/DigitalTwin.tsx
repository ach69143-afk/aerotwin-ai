import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useStore } from '../store/useStore';
import * as THREE from 'three';

import { useEffect } from 'react';

function TelemetryLabel() {
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe outside React render cycle
    const unsubscribe = useStore.subscribe((state) => {
      if (labelRef.current && state.telemetry) {
        labelRef.current.innerHTML = `[PLACEHOLDER ENGINE MODEL]<br/>RPM: ${state.telemetry.rpm.toFixed(0)}`;
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Html position={[0, 1.5, 0]} center>
      <div 
        ref={labelRef}
        className="bg-black/80 text-cyan-400 px-3 py-1 rounded text-xs font-mono border border-cyan-800 whitespace-nowrap"
      >
        [PLACEHOLDER ENGINE MODEL]
        <br />
        RPM: 0
      </div>
    </Html>
  );
}

function EnginePlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Use a ref to store the latest telemetry instead of subscribing to state
  const telemetryRef = useRef(useStore.getState().telemetry);

  useEffect(() => {
    // Update the ref without triggering React re-renders
    const unsubscribe = useStore.subscribe((state) => {
      telemetryRef.current = state.telemetry;
    });
    return unsubscribe;
  }, []);

  useFrame((_, delta) => {
    const telemetry = telemetryRef.current;
    if (meshRef.current && telemetry) {
      // RPM drives rotation
      meshRef.current.rotation.y += (telemetry.rpm / 60) * 2 * Math.PI * delta * 0.01;
      
      // Vibration drives jitter
      const vib = telemetry.vibration;
      meshRef.current.position.x = (Math.random() - 0.5) * 0.01 * vib;
      meshRef.current.position.y = (Math.random() - 0.5) * 0.01 * vib;

      // CHT drives emissive color
      // Map 150 -> black, 180 -> red
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const t = Math.max(0, Math.min(1, (telemetry.cht - 150) / 30));
      mat.emissive.setRGB(t, t * 0.2, 0); // goes to red
      mat.emissiveIntensity = t * 2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#333" roughness={0.7} metalness={0.8} />
      <TelemetryLabel />
    </mesh>
  );
}

export function DigitalTwin({ hideTitle }: { hideTitle?: boolean }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-black/50 rounded-sm border border-border relative">
      <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <EnginePlaceholder />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
      {!hideTitle && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <h3 className="text-cyan-500 font-mono text-sm tracking-wider">3D DIGITAL TWIN</h3>
          <p className="text-muted-foreground text-xs font-mono">REAL-TIME TELEMETRY MAPPING</p>
        </div>
      )}
    </div>
  );
}
