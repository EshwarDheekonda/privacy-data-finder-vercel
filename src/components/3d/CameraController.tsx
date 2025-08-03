import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const CameraController = ({ phase }: CameraControllerProps) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Phase-based camera movements
    switch (phase) {
      case 'intro':
        // Camera zooms in dramatically
        targetPosition.current.set(0, 0, 8 - Math.min(time * 2, 3));
        break;

      case 'shield-reveal':
        // Gentle orbital movement
        const radius = 5;
        targetPosition.current.set(
          Math.sin(time * 0.2) * 0.5,
          Math.cos(time * 0.15) * 0.3,
          radius
        );
        break;

      case 'text-appear':
        // Pull back slightly for text visibility
        targetPosition.current.set(0, 0.5, 6);
        break;

      case 'complete':
        // Subtle floating movement
        targetPosition.current.set(
          Math.sin(time * 0.1) * 0.2,
          Math.cos(time * 0.08) * 0.1,
          5.5
        );
        break;
    }

    // Smooth camera interpolation
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(targetLookAt.current.x, targetLookAt.current.y, targetLookAt.current.z);

    // Add subtle camera shake for immersion
    if (phase === 'shield-reveal' || phase === 'text-appear') {
      camera.position.x += (Math.random() - 0.5) * 0.001;
      camera.position.y += (Math.random() - 0.5) * 0.001;
    }
  });

  return null;
};