import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingElementsProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const FloatingElements = ({ phase }: FloatingElementsProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const securityIcons = ['🛡️', '🔐', '👁️', '📊', '🚨', '💻'];

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Only show floating elements after shield reveal
    if (phase === 'intro') {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Rotate the entire group
    groupRef.current.rotation.y = time * 0.1;

    // Individual element animations
    groupRef.current.children.forEach((child, index) => {
      if (child instanceof THREE.Group) {
        const offset = (index / securityIcons.length) * Math.PI * 2;
        const radius = 5 + Math.sin(time + offset) * 0.5;
        
        child.position.x = Math.cos(time * 0.5 + offset) * radius;
        child.position.y = Math.sin(time * 0.3 + offset) * 2;
        child.position.z = Math.sin(time * 0.4 + offset) * 3;
        
        // Individual rotation
        child.rotation.y = time + offset;
        child.rotation.z = Math.sin(time * 2 + offset) * 0.2;
      }
    });
  });

  if (phase === 'intro') return null;

  return (
    <group ref={groupRef}>
      {securityIcons.map((icon, index) => (
        <group key={index}>
          <Text
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {icon}
          </Text>
          
          {/* Subtle glow behind each icon */}
          <mesh position={[0, 0, -0.1]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};