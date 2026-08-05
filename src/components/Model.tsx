import { useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

interface ModelProps {
  url: string;
  onLoad?: (scene: THREE.Group) => void;
}

export function Model({ url, onLoad }: ModelProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (onLoad && scene) {
      onLoad(scene);
    }
  }, [scene, onLoad]);

  // Traverse model to enable shadows on meshes
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={scene} dispose={null} />;
}


