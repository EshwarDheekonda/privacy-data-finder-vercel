import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { AnimatedShield } from './3d/AnimatedShield';
import { ParticleField } from './3d/ParticleField';
import { HeroText } from './3d/HeroTextFixed';
import { FloatingElements } from './3d/FloatingElements';
import { CameraController } from './3d/CameraController';
import { ErrorBoundary } from './3d/ErrorBoundary';

interface Hero3DProps {
  onAnimationComplete?: () => void;
}

export const Hero3D = ({ onAnimationComplete }: Hero3DProps) => {
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'shield-reveal' | 'text-appear' | 'complete'>('intro');
  const [isLoading, setIsLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check WebGL support
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }, []);

  // Handle WebGL context loss
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost');
      setHasError(true);
    };

    const handleContextRestore = () => {
      console.info('WebGL context restored');
      setHasError(false);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestore);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestore);
    };
  }, []);

  useEffect(() => {
    // Check WebGL support on mount
    if (!checkWebGLSupport()) {
      setWebglSupported(false);
      setIsLoading(false);
      return;
    }

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
  }, [onAnimationComplete, checkWebGLSupport]);

  // CSS Fallback Component
  const CSSFallback = () => (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-background via-background/90 to-primary/5">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-4xl">🛡️</span>
            </div>
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-primary/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Privacy Shield
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced PII Risk Assessment Tool
            </p>
          </div>
        </div>
      </div>
      <HeroText phase={animationPhase} />
    </div>
  );

  // Show fallback if WebGL not supported or error occurred
  if (!webglSupported || hasError) {
    return <CSSFallback />;
  }

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
      <ErrorBoundary fallback={<CSSFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          dpr={[1, Math.min(window.devicePixelRatio, 2)]}
          gl={{ 
            antialias: false, 
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: true
          }}
          className="absolute inset-0"
        >
          <Suspense fallback={null}>
            {/* Lighting Setup */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <pointLight position={[-5, -5, -5]} intensity={0.3} color="#3b82f6" />
            
            {/* Camera Controls */}
            <CameraController phase={animationPhase} />
            
            {/* 3D Elements */}
            <AnimatedShield phase={animationPhase} />
            <ParticleField phase={animationPhase} />
            <FloatingElements phase={animationPhase} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

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