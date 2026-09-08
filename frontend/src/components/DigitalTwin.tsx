import { useRef, useEffect, useMemo, Suspense, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, Html, Environment, Grid } from '@react-three/drei';
import { useStore } from '../store/useStore';
import * as THREE from 'three';

// ─── Loading Indicator ─────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-cyan-400 text-xs font-mono tracking-widest">LOADING DIGITAL TWIN</p>
          <p className="text-zinc-500 text-[10px] font-mono mt-1">Loading engine model...</p>
        </div>
      </div>
    </Html>
  );
}

// ─── Error Boundary ─────────────────────────────────────────────────

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-sm font-mono tracking-widest">DIGITAL TWIN MODEL UNAVAILABLE</p>
            <p className="text-zinc-500 text-[10px] font-mono mt-2">Failed to load engine model</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Engine Model ───────────────────────────────────────────────────

const ENGINE_MODEL_PATH = '/models/engine.glb';

function EngineModel() {
  const { scene } = useGLTF(ENGINE_MODEL_PATH, true, true);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Ref-based telemetry subscription — zero React re-renders
  const telemetryRef = useRef(useStore.getState().telemetry);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      telemetryRef.current = state.telemetry;
    });
    return unsubscribe;
  }, []);

  // Smoothed values for interpolation
  const smoothed = useRef({ vibration: 0, thermalT: 0, faultIntensity: 0 });

  // Clone the scene and apply premium material + compute centering transform
  const { engineScene, materials } = useMemo(() => {
    const cloned = scene.clone(true);

    // Compute bounding box of entire scene
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Scale to fit ~4.5 units (larger presence) and center at origin
    const scale = 4.5 / maxDim;
    cloned.scale.setScalar(scale);
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // Apply premium dark metallic material to all meshes
    const mats: THREE.MeshStandardMaterial[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0.22, 0.25, 0.28), // dark gunmetal/steel
          roughness: 0.38,
          metalness: 0.75,
          envMapIntensity: 1.0,
        });
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mats.push(mat);
      }
    });

    return { engineScene: cloned, materials: mats };
  }, [scene]);

  // Frame-level camera fitting on first render
  const hasFramed = useRef(false);
  useEffect(() => {
    if (groupRef.current && !hasFramed.current) {
      hasFramed.current = true;
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 2;
      camera.position.set(dist * 0.7, dist * 0.5, dist * 0.7);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Per-frame telemetry-driven animation
  useFrame((state, delta) => {
    const telemetry = telemetryRef.current;
    if (!groupRef.current || !telemetry) return;

    const sm = smoothed.current;
    const lerpSpeed = 1 - Math.pow(0.001, delta); // smooth interpolation factor

    // Determine fault state
    const isFault = telemetry.status === 'ANOMALY DETECTED' || telemetry.status === 'CRITICAL FAILURE';
    const isCritical = telemetry.status === 'CRITICAL FAILURE';

    // Target fault intensity: 0 = normal, 0.5 = anomaly, 1.0 = critical
    const targetFault = isCritical ? 1.0 : isFault ? 0.5 : 0;
    sm.faultIntensity += (targetFault - sm.faultIntensity) * lerpSpeed;

    // ── Vibration ───────────────────────────────────────────
    const vibTarget = telemetry.vibration * (1 + sm.faultIntensity * 3);
    sm.vibration += (vibTarget - sm.vibration) * lerpSpeed;

    // Smooth sinusoidal vibration instead of Math.random() jitter
    // Uses multiple prime frequencies for organic mechanical feel
    const time = state.clock.elapsedTime;
    const vibScale = 0.003 * sm.vibration;
    groupRef.current.position.x = Math.sin(time * 47.0) * vibScale + Math.sin(time * 13.7) * vibScale * 0.3;
    groupRef.current.position.y = Math.sin(time * 31.0) * vibScale + Math.sin(time * 7.3) * vibScale * 0.3;
    groupRef.current.rotation.z = Math.sin(time * 23.0) * vibScale * 0.02;

    // ── Thermal emissive (CHT) ──────────────────────────────
    // CHT 150°C → no glow, CHT 180°C → full thermal glow
    const thermalTarget = Math.max(0, Math.min(1, (telemetry.cht - 150) / 30));
    sm.thermalT += (thermalTarget - sm.thermalT) * lerpSpeed;

    const t = sm.thermalT;
    const f = sm.faultIntensity;

    // Emissive: amber in normal thermal, shifts to red during faults
    const emR = t * (1.0 - f * 0.2) + f * 0.8;
    const emG = t * (0.3 - f * 0.2);
    const emB = 0;
    const emIntensity = Math.max(t * 1.5, f * 2.0);

    for (const mat of materials) {
      mat.emissive.setRGB(emR, emG, emB);
      mat.emissiveIntensity = emIntensity;

      // Subtle roughness shift during faults (makes surface look hotter)
      mat.roughness = 0.35 + f * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={engineScene} />
    </group>
  );
}

// Preload the model so Suspense can show the loading state
useGLTF.preload(ENGINE_MODEL_PATH, true, true);

// ─── Telemetry Overlay ─────────────────────────────────────────────

function TelemetryOverlay({ hideTitle }: { hideTitle?: boolean }) {
  const telemetry = useStore((s) => s.throttledTelemetry);
  if (!telemetry) return null;

  return (
    <>
      {!hideTitle && (
        <div className="absolute top-3 left-3 md:top-5 md:left-5 pointer-events-none flex flex-col gap-1 z-10">
          <h3 className="text-cyan-500 font-mono text-xs md:text-sm tracking-widest font-bold">3D DIGITAL TWIN</h3>
          <p className="text-muted-foreground text-[8px] md:text-[10px] font-mono tracking-widest uppercase hidden sm:block">Live Engine Telemetry Mapping</p>
          <div className="flex items-center gap-2 mt-1 md:mt-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-emerald-400 text-[8px] md:text-[10px] font-mono tracking-widest">MODEL ONLINE</span>
          </div>
        </div>
      )}

      <div className="absolute right-2 top-2 md:right-5 md:top-5 pointer-events-none flex flex-row md:flex-col gap-2 md:gap-3 items-end z-10 flex-wrap justify-end max-w-[60%] md:max-w-none">
        {[
          { label: 'RPM', value: telemetry.rpm.toFixed(0), unit: 'REV/MIN', color: 'text-emerald-400' },
          { label: 'CHT', value: telemetry.cht.toFixed(1), unit: '°C', color: telemetry.cht > 165 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'VIBRATION', value: telemetry.vibration.toFixed(2), unit: 'MM/S', color: telemetry.vibration > 0.4 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'AI STATE', value: telemetry.status, unit: '', color: telemetry.status === 'HEALTHY' ? 'text-emerald-400' : 'text-red-500' }
        ].map((stat, i) => (
          <div key={i} className="text-right bg-[#05080D]/70 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-sm border border-cyan-500/30 min-w-[70px] md:min-w-[130px] shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <p className="text-cyan-400/80 text-[7px] md:text-[9px] font-mono tracking-widest">{stat.label}</p>
            <div className="flex items-baseline justify-end gap-1 mt-0 md:mt-0.5">
              <span className={`text-xs md:text-lg font-mono font-medium tracking-tight ${stat.color}`}>{stat.value}</span>
              {stat.unit && <span className="text-cyan-500/50 text-[7px] md:text-[9px] font-mono hidden sm:inline">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cyan-500/50 opacity-50 pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-cyan-500/50 opacity-50 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-cyan-500/50 opacity-50 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cyan-500/50 opacity-50 pointer-events-none" />
    </>
  );
}

// ─── Main DigitalTwin Component ─────────────────────────────────────

export function DigitalTwin({ hideTitle }: { hideTitle?: boolean }) {
  return (
    <div className="w-full h-full min-h-[320px] md:min-h-[400px] rounded-sm relative bg-[#05080D] overflow-hidden border border-[#06b6d4]/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <ModelErrorBoundary>
        <Canvas
          camera={{ position: [5, 3.5, 5], fov: 45 }}
          shadows
          dpr={[1, 1.2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            powerPreference: 'high-performance',
          }}
        >
          <color attach="background" args={['#05080D']} />
          <fog attach="fog" args={['#05080D', 8, 25]} />

          {/* Key Light — slightly reduced for professional look */}
          <ambientLight intensity={0.35} color="#b0c4de" />
          <directionalLight
            position={[5, 8, 4]}
            intensity={2.0}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={20}
            shadow-camera-near={0.1}
            shadow-bias={-0.001}
          />
          {/* Cyan Rim Light */}
          <pointLight position={[-4, -2, -3]} intensity={1.5} color="#06b6d4" />
          {/* Blue Fill Light */}
          <pointLight position={[0, 3, -4]} intensity={0.6} color="#3b82f6" />
          {/* Warm Fill from below — subtle depth */}
          <pointLight position={[3, -3, 2]} intensity={0.3} color="#f59e0b" />

          {/* Environment for reflections */}
          <Environment preset="city" background={false} />

          {/* Subtle Technical Grid */}
          <Grid
            renderOrder={-1}
            position={[0, -1.5, 0]}
            infiniteGrid
            fadeDistance={20}
            fadeStrength={1}
            cellColor="#06b6d4"
            sectionColor="#06b6d4"
            cellSize={0.5}
            sectionSize={2.5}
            cellThickness={0.2}
            sectionThickness={0.5}
          />

          {/* Engine Model */}
          <Suspense fallback={<LoadingIndicator />}>
            <EngineModel />
          </Suspense>

          {/* Contact Shadows — reduced blur for perf */}
          <ContactShadows
            position={[0, -1.49, 0]}
            opacity={0.5}
            scale={8}
            blur={1.5}
            far={4}
            color="#000000"
          />

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={12}
            maxPolarAngle={Math.PI * 0.85}
            target={[0, 0, 0]}
          />
        </Canvas>
      </ModelErrorBoundary>
      
      <TelemetryOverlay hideTitle={hideTitle} />
    </div>
  );
}
