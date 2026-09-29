import { useRef, useEffect, useMemo, Suspense, Component, memo, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, Html, Environment, Grid } from '@react-three/drei';
import { useStore } from '../store/useStore';
import * as THREE from 'three';

// ─── Loading Indicator ─────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#2E7D32]/30 border-t-[#2E7D32] rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-[#2E7D32] text-xs font-sans tracking-widest font-medium">LOADING DIGITAL TWIN</p>
          <p className="text-[#667085] text-[10px] font-sans mt-1">Loading Rotax 915 engine model...</p>
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
            <p className="text-[#DC2626] text-sm font-sans tracking-widest font-medium">DIGITAL TWIN MODEL UNAVAILABLE</p>
            <p className="text-[#667085] text-[10px] font-sans mt-2">Failed to load engine model</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Engine Model ───────────────────────────────────────────────────

const ENGINE_MODEL_PATH = '/models/Rotax_915.glb';

function EngineModel() {
  const { scene } = useGLTF(ENGINE_MODEL_PATH, true, true);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const animationIntensity = useStore((state) => state.settings.animationIntensity);

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

  // Clone scene, apply materials, compute ONLY visible mesh bounds
  const { engineScene, materials, modelRadius, modelCenter } = useMemo(() => {
    const cloned = scene.clone(true);

    // ── Step 1: Collect ONLY visible Mesh objects (ignoring floor/helpers) ──
    const visibleMeshes: THREE.Mesh[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.visible) {
          const name = mesh.name.toLowerCase();
          const isIgnored = name.includes('floor') || 
                            name.includes('grid') || 
                            name.includes('plane') || 
                            name.includes('room') || 
                            name.includes('backdrop') || 
                            name.includes('helper') || 
                            name.includes('shadow');
          if (!isIgnored) {
            visibleMeshes.push(mesh);
          }
        }
      }
    });

    // ── Step 2: Build bounding box from visible meshes only ──
    // (Ignores cameras, lights, empty transforms, invisible helpers)
    const meshBox = new THREE.Box3();
    for (const mesh of visibleMeshes) {
      mesh.updateWorldMatrix(true, false);
      const geom = mesh.geometry;
      if (geom) {
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          const worldBox = geom.boundingBox.clone();
          worldBox.applyMatrix4(mesh.matrixWorld);
          meshBox.union(worldBox);
        }
      }
    }

    // Fallback if no visible meshes
    if (meshBox.isEmpty()) {
      meshBox.setFromObject(cloned);
    }

    const center = meshBox.getCenter(new THREE.Vector3());
    const size = meshBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // ── Step 3: Scale to fill ~5 world units ──
    const targetSize = 5.0;
    const scale = maxDim > 0 ? targetSize / maxDim : 1;
    cloned.scale.setScalar(scale);

    // ── Step 4: Re-center at origin ──
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // ── Step 5: Compute final bounding sphere of VISIBLE geometry ──
    // Re-traverse after transform to get accurate scaled bounds
    const finalBox = new THREE.Box3();
    for (const mesh of visibleMeshes) {
      mesh.updateWorldMatrix(true, false);
      const geom = mesh.geometry;
      if (geom) {
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          const wb = geom.boundingBox.clone();
          wb.applyMatrix4(mesh.matrixWorld);
          finalBox.union(wb);
        }
      }
    }

    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSphere = new THREE.Sphere();
    finalBox.getBoundingSphere(finalSphere);

    // ── Step 6: Apply metallic material to ONLY the engine meshes ──
    const mats: THREE.MeshStandardMaterial[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        const isIgnored = name.includes('floor') || 
                          name.includes('grid') || 
                          name.includes('plane') || 
                          name.includes('room') || 
                          name.includes('backdrop') || 
                          name.includes('helper') || 
                          name.includes('shadow');
        
        if (isIgnored) {
          mesh.visible = false;
        } else if (mesh.visible) {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.82, 0.84, 0.86),
            roughness: 0.35,
            metalness: 0.7,
            envMapIntensity: 1.0,
          });
          mesh.material = mat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mats.push(mat);
        }
      }
    });

    return {
      engineScene: cloned,
      materials: mats,
      modelRadius: finalSphere.radius,
      modelCenter: finalCenter,
    };
  }, [scene]);

  // ── Auto-frame: calculate camera distance from bounding sphere ──
  const hasFramed = useRef(false);
  useEffect(() => {
    if (!groupRef.current || hasFramed.current) return;
    hasFramed.current = true;

    const cam = camera as THREE.PerspectiveCamera;
    const radius = modelRadius;

    // Calculate distance so model fills ~72% of viewport
    const fovRad = cam.fov * (Math.PI / 180);
    const aspect = cam.aspect || (gl.domElement.clientWidth / gl.domElement.clientHeight);

    // Use the tighter of horizontal/vertical FOV
    const effectiveFov = aspect >= 1
      ? fovRad / 2                             // landscape: vertical FOV limits
      : (fovRad * aspect) / 2;                 // portrait: horizontal FOV limits

    const fillFraction = 0.72;
    const dist = radius / (Math.tan(effectiveFov) * fillFraction);

    // Position at a 3/4 engineering viewing angle
    const elevation = Math.PI / 6;  // 30° up
    const azimuth = Math.PI / 5;    // slightly off-axis

    cam.position.set(
      dist * Math.cos(elevation) * Math.sin(azimuth),
      dist * Math.sin(elevation),
      dist * Math.cos(elevation) * Math.cos(azimuth),
    );
    cam.lookAt(modelCenter);
    cam.near = Math.max(0.01, dist * 0.01);
    cam.far = Math.max(100, dist * 10);
    cam.updateProjectionMatrix();

    // The CameraFramer now relies on OrbitControls state from useThree.
  }, [camera, gl, modelRadius, modelCenter]);

  // Per-frame telemetry-driven animation
  useFrame((state, delta) => {
    const telemetry = telemetryRef.current;
    if (!groupRef.current || !telemetry) return;

    const sm = smoothed.current;
    const lerpSpeed = 1 - Math.pow(0.001, delta);

    // ── Use fault severity from backend for smooth transitions ──
    const faultSeverity = (telemetry as any).faultSeverity ?? 0;
    const backendFaultActive = (telemetry as any).faultActive ?? false;

    let targetFault = 0;
    if (faultSeverity > 0.01) {
      targetFault = Math.min(1.0, faultSeverity);
    }
    if (telemetry.status === 'CRITICAL FAILURE') {
      targetFault = Math.max(targetFault, 0.85);
    } else if (telemetry.status === 'ANOMALY DETECTED' && !backendFaultActive) {
      targetFault = Math.max(targetFault, 0.4);
    }

    sm.faultIntensity += (targetFault - sm.faultIntensity) * lerpSpeed;

    // ── Vibration ──
    const vibTarget = telemetry.vibration * (1 + sm.faultIntensity * 2);
    sm.vibration += (vibTarget - sm.vibration) * lerpSpeed;

    const time = state.clock.elapsedTime;
    const vibScale = 0.003 * sm.vibration * animationIntensity;
    groupRef.current.position.x = Math.sin(time * 47.0) * vibScale + Math.sin(time * 13.7) * vibScale * 0.3;
    groupRef.current.position.y = Math.sin(time * 31.0) * vibScale + Math.sin(time * 7.3) * vibScale * 0.3;
    groupRef.current.rotation.z = Math.sin(time * 23.0) * vibScale * 0.02;

    // ── Thermal emissive (CHT) ──
    const thermalTarget = Math.max(0, Math.min(1, (telemetry.cht - 150) / 30));
    sm.thermalT += (thermalTarget - sm.thermalT) * lerpSpeed;

    const t = sm.thermalT * animationIntensity;
    const f = sm.faultIntensity;
    // ── RPM-driven Green Transition Mapping ──
    // 0 -> 0%, 800 -> 10%, 1500 -> 20%, 2500 -> 40%, 3500 -> 65%, 4500 -> 85%, 5000 -> 100%
    let rpmRatio = 0;
    const rpm = telemetry.rpm;
    if (rpm <= 800) rpmRatio = (rpm / 800) * 0.10;
    else if (rpm <= 1500) rpmRatio = 0.10 + ((rpm - 800) / 700) * 0.10;
    else if (rpm <= 2500) rpmRatio = 0.20 + ((rpm - 1500) / 1000) * 0.20;
    else if (rpm <= 3500) rpmRatio = 0.40 + ((rpm - 2500) / 1000) * 0.25;
    else if (rpm <= 4500) rpmRatio = 0.65 + ((rpm - 3500) / 1000) * 0.20;
    else if (rpm <= 5000) rpmRatio = 0.85 + ((rpm - 4500) / 500) * 0.15;
    else rpmRatio = 1.0;
    
    rpmRatio = Math.max(0, Math.min(1, rpmRatio));

    // ── Severity-Based Color Ramp ──
    const cOff = { r: 0.82, g: 0.84, b: 0.86 };
    const cRun = { r: 0.72, g: 0.78, b: 0.72 };
    const cWarn = { r: 0.80, g: 0.65, b: 0.45 };
    const cFault = { r: 0.75, g: 0.40, b: 0.35 };

    const eOff = { r: 0, g: 0, b: 0, int: 0 };
    const eRun = { r: 0.03, g: 0.18, b: 0.05, int: 0.25 };
    const eWarn = { r: 0.4, g: 0.2, b: 0.0, int: 0.4 };
    const eFault = { r: 0.5, g: 0.05, b: 0.03, int: 0.5 };

    const cBase = {
      r: cOff.r + (cRun.r - cOff.r) * rpmRatio,
      g: cOff.g + (cRun.g - cOff.g) * rpmRatio,
      b: cOff.b + (cRun.b - cOff.b) * rpmRatio,
    };
    const eBase = {
      r: eOff.r + (eRun.r - eOff.r) * rpmRatio,
      g: eOff.g + (eRun.g - eOff.g) * rpmRatio,
      b: eOff.b + (eRun.b - eOff.b) * rpmRatio,
      int: eOff.int + (eRun.int - eOff.int) * rpmRatio,
    };

    let finalC, finalE;
    if (f <= 0.4) {
      const wt = f / 0.4;
      finalC = {
        r: cBase.r + (cWarn.r - cBase.r) * wt,
        g: cBase.g + (cWarn.g - cBase.g) * wt,
        b: cBase.b + (cWarn.b - cBase.b) * wt,
      };
      finalE = {
        r: eBase.r + (eWarn.r - eBase.r) * wt,
        g: eBase.g + (eWarn.g - eBase.g) * wt,
        b: eBase.b + (eWarn.b - eBase.b) * wt,
        int: eBase.int + (eWarn.int - eBase.int) * wt,
      };
    } else {
      const ft = (f - 0.4) / 0.6;
      finalC = {
        r: cWarn.r + (cFault.r - cWarn.r) * ft,
        g: cWarn.g + (cFault.g - cWarn.g) * ft,
        b: cWarn.b + (cFault.b - cWarn.b) * ft,
      };
      finalE = {
        r: eWarn.r + (eFault.r - eWarn.r) * ft,
        g: eWarn.g + (eFault.g - eWarn.g) * ft,
        b: eWarn.b + (eFault.b - eWarn.b) * ft,
        int: eWarn.int + (eFault.int - eWarn.int) * ft,
      };
    }

    const thermalR = t * 0.2;
    const thermalG = t * 0.08;
    finalE.r = Math.min(1, finalE.r + thermalR);
    finalE.g = Math.min(1, finalE.g + thermalG);
    finalE.int = Math.max(finalE.int, t * 0.3);

    for (const mat of materials) {
      mat.color.setRGB(finalC.r, finalC.g, finalC.b);
      mat.emissive.setRGB(finalE.r, finalE.g, finalE.b);
      mat.emissiveIntensity = finalE.int;
      mat.roughness = 0.35 + f * 0.12 + t * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={engineScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload(ENGINE_MODEL_PATH, true, true);

// ─── Camera Framer (runs after model loads, sets OrbitControls target) ──

function CameraFramer({ radius, center }: { radius: number; center: THREE.Vector3 }) {
  const { camera, gl, controls } = useThree((state) => ({ camera: state.camera, gl: state.gl, controls: state.controls as any }));
  const hasFramed = useRef(false);

  useFrame(() => {
    if (hasFramed.current) return;
    const currentControls = controls || (gl.domElement as any)?.__r3f?.root?.getState?.()?.controls;
    if (!currentControls) return;

    hasFramed.current = true;

    const cam = camera as THREE.PerspectiveCamera;
    const fovRad = cam.fov * (Math.PI / 180);
    const aspect = cam.aspect || (gl.domElement.clientWidth / gl.domElement.clientHeight);
    const effectiveFov = aspect >= 1 ? fovRad / 2 : (fovRad * aspect) / 2;

    const fillFraction = 0.72;
    const dist = radius / (Math.tan(effectiveFov) * fillFraction);

    const elevation = Math.PI / 6;
    const azimuth = Math.PI / 5;

    cam.position.set(
      center.x + dist * Math.cos(elevation) * Math.sin(azimuth),
      center.y + dist * Math.sin(elevation),
      center.z + dist * Math.cos(elevation) * Math.cos(azimuth),
    );
    cam.lookAt(center);
    cam.near = Math.max(0.01, dist * 0.01);
    cam.far = Math.max(100, dist * 10);
    cam.updateProjectionMatrix();

    // Set OrbitControls target to model center
    currentControls.target.copy(center);
    currentControls.minDistance = Math.max(0.5, radius * 0.4);
    currentControls.maxDistance = Math.max(20, radius * 6);
    currentControls.update();
  });

  return null;
}

// ─── Telemetry Overlay ─────────────────────────────────────────────

function TelemetryOverlay({ hideTitle }: { hideTitle?: boolean }) {
  const telemetry = useStore((s) => s.throttledTelemetry);
  if (!telemetry) return null;

  // Show startup progress when STARTING
  const isStarting = telemetry.engineState === 'STARTING';
  const startupPct = isStarting ? Math.min(100, (telemetry.rpm / 5000) * 100) : null;

  return (
    <>
      {!hideTitle && (
        <div className="absolute top-3 left-3 md:top-5 md:left-5 pointer-events-none flex flex-col gap-1 z-10">
          <h3 className="text-[#1F2933] font-sans text-xs md:text-sm tracking-widest font-semibold">DIGITAL TWIN</h3>
          <p className="text-[#667085] text-[8px] md:text-[10px] font-sans tracking-widest uppercase hidden sm:block">Rotax 915 — Live Telemetry Mapping</p>
          <div className="flex items-center gap-2 mt-1 md:mt-2">
            <div className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-pulse" />
            <span className="text-[#2E7D32] text-[8px] md:text-[10px] font-sans tracking-widest">MODEL ONLINE</span>
          </div>
        </div>
      )}

      <div className="absolute right-2 top-2 md:right-5 md:top-5 pointer-events-none flex flex-row md:flex-col gap-2 md:gap-3 items-end z-10 flex-wrap justify-end max-w-[60%] md:max-w-none">
        {/* RPM — show startup progress */}
        <div className="text-right bg-white/85 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-[#E4E7EC] min-w-[70px] md:min-w-[130px] shadow-sm">
          <p className="text-[#667085] text-[7px] md:text-[9px] font-sans tracking-widest">RPM</p>
          <div className="flex items-baseline justify-end gap-1 mt-0 md:mt-0.5">
            <span className="text-xs md:text-lg font-mono font-medium tracking-tight text-[#2E7D32]">
              {telemetry.rpm.toFixed(0)}
            </span>
            {isStarting && (
              <span className="text-[#667085] text-[7px] md:text-[9px] font-sans">/ 5000</span>
            )}
            {!isStarting && (
              <span className="text-[#667085] text-[7px] md:text-[9px] font-sans hidden sm:inline">REV/MIN</span>
            )}
          </div>
          {startupPct !== null && (
            <div className="mt-1 w-full h-1 bg-[#E4E7EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2E7D32] rounded-full transition-all duration-200"
                style={{ width: `${startupPct}%` }}
              />
            </div>
          )}
        </div>

        {/* CHT */}
        <div className="text-right bg-white/85 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-[#E4E7EC] min-w-[70px] md:min-w-[130px] shadow-sm">
          <p className="text-[#667085] text-[7px] md:text-[9px] font-sans tracking-widest">CHT</p>
          <div className="flex items-baseline justify-end gap-1 mt-0 md:mt-0.5">
            <span className={`text-xs md:text-lg font-mono font-medium tracking-tight ${telemetry.cht > 165 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
              {telemetry.cht.toFixed(1)}
            </span>
            <span className="text-[#667085] text-[7px] md:text-[9px] font-sans hidden sm:inline">°C</span>
          </div>
        </div>

        {/* Vibration */}
        <div className="text-right bg-white/85 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-[#E4E7EC] min-w-[70px] md:min-w-[130px] shadow-sm">
          <p className="text-[#667085] text-[7px] md:text-[9px] font-sans tracking-widest">VIBRATION</p>
          <div className="flex items-baseline justify-end gap-1 mt-0 md:mt-0.5">
            <span className={`text-xs md:text-lg font-mono font-medium tracking-tight ${telemetry.vibration > 0.4 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
              {telemetry.vibration.toFixed(2)}
            </span>
            <span className="text-[#667085] text-[7px] md:text-[9px] font-sans hidden sm:inline">MM/S</span>
          </div>
        </div>

        {/* State */}
        <div className="text-right bg-white/85 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-[#E4E7EC] min-w-[70px] md:min-w-[130px] shadow-sm">
          <p className="text-[#667085] text-[7px] md:text-[9px] font-sans tracking-widest">STATE</p>
          <div className="flex items-baseline justify-end gap-1 mt-0 md:mt-0.5">
            <span className={`text-xs md:text-lg font-mono font-medium tracking-tight ${
              telemetry.status === 'HEALTHY' ? 'text-[#2E7D32]' :
              isStarting ? 'text-[#2563EB]' : 'text-[#DC2626]'
            }`}>
              {isStarting ? 'STARTING' : telemetry.status}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Inner Canvas Content (uses modelRadius for OrbitControls limits) ──

function CanvasContent({ modelRadius, modelCenter }: { modelRadius: number; modelCenter: THREE.Vector3 }) {
  const settings = useStore((state) => state.settings);

  return (
    <>
      <color attach="background" args={['#F0F2F5']} />
      <fog attach="fog" args={['#F0F2F5', 14, 35]} />

      {/* Professional studio lighting */}
      <ambientLight intensity={0.5} color="#ffffff" />
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
      <pointLight position={[-4, 2, -3]} intensity={0.8} color="#e8f0e8" />
      <pointLight position={[3, -3, 2]} intensity={0.3} color="#f5f0e8" />

      <Environment preset="city" background={false} />

      {/* Subtle grid — small, won't affect framing */}
      <Grid
        renderOrder={-1}
        position={[0, -2.0, 0]}
        infiniteGrid
        fadeDistance={12}
        fadeStrength={2}
        cellColor="#d8dce0"
        sectionColor="#c0c4c8"
        cellSize={0.5}
        sectionSize={2.5}
        cellThickness={0.12}
        sectionThickness={0.3}
      />

      {/* Engine Model */}
      <Suspense fallback={<LoadingIndicator />}>
        <EngineModel />
      </Suspense>

      {/* Camera framing — runs after model is loaded */}
      <CameraFramer radius={modelRadius} center={modelCenter} />

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, -1.99, 0]}
        opacity={0.25}
        scale={8}
        blur={1.5}
        far={4}
        color="#1F2933"
      />

      {/* Controls — minDistance/maxDistance set by CameraFramer */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        autoRotate={settings.autoRotation}
        autoRotateSpeed={0.6}
        minDistance={Math.max(0.5, modelRadius * 0.4)}
        maxDistance={Math.max(20, modelRadius * 6)}
        maxPolarAngle={Math.PI * 0.85}
        target={[modelCenter.x, modelCenter.y, modelCenter.z]}
      />
    </>
  );
}

// ─── Main DigitalTwin Component ─────────────────────────────────────

// We need the model bounds BEFORE rendering the Canvas content.
// Use a wrapper that pre-loads the GLTF and computes bounds.

function useModelBounds() {
  const { scene } = useGLTF(ENGINE_MODEL_PATH, true, true);

  return useMemo(() => {
    // Compute bounds from visible engine meshes only
    const meshBox = new THREE.Box3();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.visible) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        const isIgnored = name.includes('floor') || 
                          name.includes('grid') || 
                          name.includes('plane') || 
                          name.includes('room') || 
                          name.includes('backdrop') || 
                          name.includes('helper') || 
                          name.includes('shadow');
        if (!isIgnored) {
          mesh.updateWorldMatrix(true, false);
          const geom = mesh.geometry;
          if (geom) {
            geom.computeBoundingBox();
            if (geom.boundingBox) {
              const wb = geom.boundingBox.clone();
              wb.applyMatrix4(mesh.matrixWorld);
              meshBox.union(wb);
            }
          }
        }
      }
    });

    if (meshBox.isEmpty()) {
      meshBox.setFromObject(scene);
    }

    const size = meshBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 5.0;
    const scale = maxDim > 0 ? targetSize / maxDim : 1;

    // Compute scaled center not needed here since we center it inside EngineModel

    // Approximate radius after scaling
    const sphere = new THREE.Sphere();
    meshBox.getBoundingSphere(sphere);
    const scaledRadius = sphere.radius * scale;

    return { radius: scaledRadius, center: new THREE.Vector3(0, 0, 0) };
  }, [scene]);
}

export const DigitalTwin = memo(function DigitalTwin({ hideTitle }: { hideTitle?: boolean }) {
  const settings = useStore((state) => state.settings);

  // Pre-compute model bounds for camera framing
  // (useGLTF caches, so this doesn't re-download)
  let modelRadius = 3.0;
  let modelCenter = new THREE.Vector3(0, 0, 0);

  try {
    const bounds = useModelBounds();
    modelRadius = bounds.radius;
    modelCenter = bounds.center;
  } catch {
    // Model not yet loaded, use defaults
  }

  return (
    <div className="w-full h-full min-h-[320px] md:min-h-[400px] rounded-xl relative bg-[#F7F8FA] overflow-hidden border border-[#E4E7EC] shadow-sm">
      <ModelErrorBoundary>
        <Canvas
          camera={{ position: [5, 3.5, 5], fov: 45 }}
          shadows
          dpr={[1, 1.2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            powerPreference: 'high-performance',
          }}
        >
          <CanvasContent modelRadius={modelRadius} modelCenter={modelCenter} />
        </Canvas>
      </ModelErrorBoundary>

      {settings.showTelemetryOverlay && <TelemetryOverlay hideTitle={hideTitle} />}
    </div>
  );
});
