import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stage, CameraControls, CameraControlsImpl } from '@react-three/drei';
import * as THREE from 'three';
import { Model } from './Model';

interface IdleWobbleProps {
  controlsRef: React.RefObject<CameraControlsImpl | null>;
  modelSize: THREE.Vector3 | null;
}

function IdleWobble({ controlsRef, modelSize }: IdleWobbleProps) {
  const isInteracting = useRef(false);
  const lastInteractionTime = useRef(0);
  const baseAzimuth = useRef<number | null>(null);
  const wasInteracting = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleControlStart = () => {
      isInteracting.current = true;
    };
    const handleControlEnd = () => {
      isInteracting.current = false;
    };

    controls.addEventListener('controlstart', handleControlStart);
    controls.addEventListener('controlend', handleControlEnd);

    baseAzimuth.current = controls.azimuthAngle;

    return () => {
      controls.removeEventListener('controlstart', handleControlStart);
      controls.removeEventListener('controlend', handleControlEnd);
    };
  }, [controlsRef, modelSize]);

  useFrame((state) => {
    const controls = controlsRef.current;
    if (!controls || !modelSize) return;

    const elapsedTime = state.clock.getElapsedTime();

    if (isInteracting.current) {
      wasInteracting.current = true;
      baseAzimuth.current = null;
      return;
    }

    if (wasInteracting.current && !isInteracting.current) {
      wasInteracting.current = false;
      lastInteractionTime.current = elapsedTime;
      baseAzimuth.current = controls.azimuthAngle;
    }

    if (baseAzimuth.current === null) {
      baseAzimuth.current = controls.azimuthAngle;
      lastInteractionTime.current = elapsedTime;
    }

    const idleDelay = 1.5; // seconds
    if (elapsedTime - lastInteractionTime.current > idleDelay) {
      const t = elapsedTime - lastInteractionTime.current - idleDelay;
      const speed = 1.8; // Wobble frequency
      const amplitude = 0.12; // Wobble amplitude (radians)
      const wobble = Math.sin(t * speed) * amplitude;
      
      controls.rotateTo(baseAzimuth.current + wobble, controls.polarAngle, false);
    }
  });

  return null;
}

// Helper component inside Suspense that fits the camera once the model GLB loads
interface FitCameraProps {
  controlsRef: React.RefObject<CameraControlsImpl | null>;
  modelSize: THREE.Vector3 | null;
  shadowOffset: number;
}

function FitCamera({ controlsRef, modelSize, shadowOffset }: FitCameraProps) {
  useEffect(() => {
    if (controlsRef.current && modelSize) {
      // 1. Create a padded bounding box centered at [0, shadowOffset, 0]
      // Multiply size by 1.15 to position camera closer (making the model look larger)
      const paddedSize = modelSize.clone().multiplyScalar(1.15);
      const centeredBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, shadowOffset, 0),
        paddedSize
      );

      // 2. Fit the camera controls to this padded box
      controlsRef.current.fitToBox(centeredBox, false);

      // 3. Rotate the camera to look from a corner (45 degrees azimuth, 78 degrees polar for a lower view)
      controlsRef.current.rotateTo(Math.PI / 4, Math.PI / 2.3, false);

      // 4. Set the rotation pivot point exactly to [0, shadowOffset, 0]
      controlsRef.current.setTarget(0, shadowOffset, 0, false);
    }
  }, [modelSize, shadowOffset, controlsRef]);

  return null;
}

interface FrameRenderNotifierProps {
  onReady: () => void;
}

function FrameRenderNotifier({ onReady }: FrameRenderNotifierProps) {
  const frameCount = useRef(0);
  const triggered = useRef(false);

  useFrame(() => {
    if (triggered.current) return;
    frameCount.current++;
    if (frameCount.current >= 5) { // Render 5 frames first to ensure GPU uploads/compiles are complete
      triggered.current = true;
      onReady();
    }
  });

  return null;
}

interface ModelViewerProps {
  modelUrl: string;
  onLoaded?: () => void;
  imageUrl?: string;
}

export function ModelViewer({ modelUrl, onLoaded, imageUrl }: ModelViewerProps) {
  const controlsRef = useRef<CameraControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelSize, setModelSize] = useState<THREE.Vector3 | null>(null);
  const [shadowOffset, setShadowOffset] = useState<number>(0);
  const [isSceneReady, setIsSceneReady] = useState(false);

  const handleCapture = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Get the exact target filename from imageUrl or fallback to modelUrl
    const targetPath = imageUrl || modelUrl;
    const filename = targetPath.split('/').pop()?.replace('.glb', '.webp') || 'model.webp';

    // Capture the WebGL context (transparent background)
    const dataUrl = canvas.toDataURL('image/webp', 1.0);

    // Download the screenshot
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, [imageUrl, modelUrl]);

  const handleModelLoad = useCallback((scene: THREE.Group) => {
    // Reset position first to calculate original bounds
    scene.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Find the true lowest Y point of any mesh to locate the bottom of the model
    let minY = Infinity;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const meshBox = new THREE.Box3().setFromObject(child);
        if (meshBox.min.y < minY) {
          minY = meshBox.min.y;
        }
      }
    });

    if (minY === Infinity) {
      minY = box.min.y;
    }

    // Centering the model group exactly at [0, 0, 0] horizontally, and placing the bottom at Y = 0
    scene.position.x = -center.x;
    scene.position.z = -center.z;
    scene.position.y = -minY; // Places the bottom of the model exactly on the ground (Y = 0)

    // Recalculate size and center after positioning
    const positionedBox = new THREE.Box3().setFromObject(scene);
    const positionedSize = new THREE.Vector3();
    positionedBox.getSize(positionedSize);
    const positionedCenter = new THREE.Vector3();
    positionedBox.getCenter(positionedCenter);

    setShadowOffset(positionedCenter.y);
    setModelSize(positionedSize);
    setIsSceneReady(true);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
        }}
        camera={{ position: [0, 0, 4], fov: 45 }}
      >
        <Suspense fallback={null}>
          <Stage
            preset="rembrandt"
            intensity={1}
            environment={{
              preset: 'city',
              background: false,
            }}
            adjustCamera={false} // Disable Drei's default Bounds fitting to prevent target.copy crash with CameraControls
            shadows={false} // Disable all stage-level floor shadows
          >
            <Model url={modelUrl} onLoad={handleModelLoad} />
          </Stage>

          {/* Automatically adjust/fit camera when model loads and size is set */}
          {modelSize && (
            <>
              <FitCamera
                controlsRef={controlsRef}
                modelSize={modelSize}
                shadowOffset={shadowOffset}
              />
              <IdleWobble
                controlsRef={controlsRef}
                modelSize={modelSize}
              />
            </>
          )}

          {/* Trigger onLoaded only after the Canvas has rendered at least 5 frames of the model */}
          {isSceneReady && onLoaded && (
            <FrameRenderNotifier onReady={onLoaded} />
          )}
        </Suspense>
        <CameraControls ref={controlsRef} minDistance={1} maxDistance={20} dollySpeed={0} truckSpeed={0} />
      </Canvas>

      {/* Dev helper: Capture WebGL screenshot to match Option 1 alignment */}
      <button
        onClick={handleCapture}
        title="Capture placeholder screenshot (Option 1)"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          opacity: 0.4,
          transition: 'opacity 0.2s ease, background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.4';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      </button>
    </div>
  );
}
