import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { AnimatedShield } from './3d/AnimatedShield';
import { ParticleField } from './3d/ParticleField';
import { HeroText } from './3d/HeroText';
import { FloatingElements } from './3d/FloatingElements';
import { CameraController } from './3d/CameraController';

interface Hero3DProps {
  onAnimationComplete?: () => void;
}

export const Hero3D = ({ onAnimationComplete }: Hero3DProps) => {
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'shield-reveal' | 'text-appear' | 'complete'>('intro');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Initial loading delay
    timers.push(setTimeout(() => {
      setIsLoading(false);
      setAnimationPhase('shield-reveal');
    }, 500));

    // Shield reveal phase (0.5-2.5s)
    timers.push(setTimeout(() => {
      setAnimationPhase('text-appear');
    }, 2500));

    // Text appear phase (2.5-4.5s)
    timers.push(setTimeout(() => {
      setAnimationPhase('complete');
      onAnimationComplete?.();
    }, 4500));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [onAnimationComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-background via-background/90 to-primary/5">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Initializing 3D Environment...</p>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          {/* Lighting Setup */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
          
          {/* Camera Controls */}
          <CameraController phase={animationPhase} />
          
          {/* 3D Elements */}
          <AnimatedShield phase={animationPhase} />
          <ParticleField phase={animationPhase} />
          <FloatingElements phase={animationPhase} />
        </Suspense>
      </Canvas>

      {/* HTML Overlay for Text */}
      <HeroText phase={animationPhase} />

      {/* Background Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-primary/20 to-transparent opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-secondary/20 to-transparent opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};