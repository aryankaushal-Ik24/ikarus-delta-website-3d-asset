import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, CameraControls, CameraControlsImpl } from '@react-three/drei';
import * as THREE from 'three';
import { Model } from './Model';

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

interface ModelViewerProps {
  modelUrl: string;
  onLoaded?: () => void;
}

export function ModelViewer({ modelUrl, onLoaded }: ModelViewerProps) {
  const controlsRef = useRef<CameraControlsImpl>(null);
  const [modelSize, setModelSize] = useState<THREE.Vector3 | null>(null);
  const [shadowOffset, setShadowOffset] = useState<number>(0);

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
    
    if (onLoaded) {
      onLoaded();
    }
  }, [onLoaded]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
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
            <FitCamera
              controlsRef={controlsRef}
              modelSize={modelSize}
              shadowOffset={shadowOffset}
            />
          )}
        </Suspense>
        <CameraControls ref={controlsRef} minDistance={1} maxDistance={20} dollySpeed={0} truckSpeed={0} />
      </Canvas>
    </div>
  );
}
