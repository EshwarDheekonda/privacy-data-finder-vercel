import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleFieldProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const ParticleField = ({ phase }: ParticleFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle positions
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(3000);
    
    for (let i = 0; i < 1000; i++) {
      // Create particles in a sphere around the center
      const radius = 8 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;

    // Rotate the entire particle field
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;

    // Phase-based effects
    switch (phase) {
      case 'intro':
        // Particles spiral inward
        const introProgress = Math.min(time * 0.5, 1);
        pointsRef.current.scale.setScalar(introProgress);
        break;

      case 'shield-reveal':
        // Gentle pulsing
        const pulseScale = 1 + Math.sin(time * 2) * 0.05;
        pointsRef.current.scale.setScalar(pulseScale);
        break;

      case 'text-appear':
        // More dynamic movement
        pointsRef.current.rotation.y = time * 0.1;
        break;

      case 'complete':
        // Slow, steady rotation
        pointsRef.current.rotation.y = time * 0.02;
        break;
    }
  });

  const particleColor = phase === 'intro' ? '#64748b' : '#3b82f6';
  const particleSize = phase === 'text-appear' ? 0.03 : 0.02;

  return (
    <Points ref={pointsRef} positions={particlePositions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={particleColor}
        size={particleSize}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};