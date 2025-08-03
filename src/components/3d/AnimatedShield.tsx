import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedShieldProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const AnimatedShield = ({ phase }: AnimatedShieldProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current || !shieldRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;

    // Base rotation
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
    groupRef.current.rotation.x = Math.cos(time * 0.2) * 0.05;

    // Phase-based animations
    switch (phase) {
      case 'intro':
        // Scale from 0 to full size
        const introScale = Math.min(time * 0.8, 1);
        groupRef.current.scale.setScalar(introScale);
        groupRef.current.rotation.z = (1 - introScale) * Math.PI * 2;
        break;

      case 'shield-reveal':
        // Gentle floating and rotation
        groupRef.current.position.y = Math.sin(time * 1.5) * 0.1;
        groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
        
        // Pulsing glow effect
        const glowIntensity = 0.5 + Math.sin(time * 3) * 0.3;
        if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
          glowRef.current.material.opacity = glowIntensity;
        }
        break;

      case 'text-appear':
        // More dynamic movement
        groupRef.current.position.y = Math.sin(time * 2) * 0.15;
        groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.15;
        break;

      case 'complete':
        // Subtle idle animation
        groupRef.current.position.y = Math.sin(time * 0.8) * 0.08;
        groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
        break;
    }
  });

  const shieldColor = phase === 'intro' ? '#1e293b' : '#3b82f6';
  const glowColor = '#60a5fa';

  return (
    <group ref={groupRef}>
      {/* Main Shield - Using simple cylinder geometry */}
      <mesh ref={shieldRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 0.8, 0.3, 8]} />
        <meshStandardMaterial
          color={shieldColor}
          metalness={0.6}
          roughness={0.3}
          emissive={shieldColor}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Glow Effect */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inner Core */}
      <Sphere args={[0.25]} position={[0, 0, 0.2]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#60a5fa"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Privacy Symbol - Simple text without custom font */}
      {phase !== 'intro' && (
        <mesh position={[0, 0, 0.35]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
};