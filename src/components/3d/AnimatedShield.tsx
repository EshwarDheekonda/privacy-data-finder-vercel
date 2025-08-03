import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedShieldProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const AnimatedShield = ({ phase }: AnimatedShieldProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Shield geometry - custom shield shape
  const shieldGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Create shield shape path
    shape.moveTo(0, 1.5);
    shape.bezierCurveTo(-0.8, 1.2, -1.2, 0.5, -1.2, -0.2);
    shape.bezierCurveTo(-1.2, -0.8, -0.8, -1.5, 0, -2);
    shape.bezierCurveTo(0.8, -1.5, 1.2, -0.8, 1.2, -0.2);
    shape.bezierCurveTo(1.2, 0.5, 0.8, 1.2, 0, 1.5);

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.05,
      bevelThickness: 0.02
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

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
      {/* Main Shield */}
      <mesh ref={shieldRef} geometry={shieldGeometry} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color={shieldColor}
          metalness={0.8}
          roughness={0.2}
          distort={0.1}
          speed={2}
          emissive={shieldColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glow Effect */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inner Core */}
      <Sphere args={[0.3]} position={[0, 0, 0.15]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#60a5fa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Privacy Symbol (Lock Icon) */}
      {phase !== 'intro' && (
        <Text
          position={[0, 0, 0.25]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          🔒
        </Text>
      )}
    </group>
  );
};