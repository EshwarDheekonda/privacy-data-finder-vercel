import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface HeroTextProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const HeroText = ({ phase }: HeroTextProps) => {
  const [textVisible, setTextVisible] = useState(false);
  const [currentText, setCurrentText] = useState(0);

  const textLines = [
    "Advanced PII Risk Assessment",
    "Discover your digital footprint",
    "Protect your privacy online"
  ];

  useEffect(() => {
    if (phase === 'text-appear' || phase === 'complete') {
      setTextVisible(true);
      
      // Stagger text appearance
      const timer = setTimeout(() => {
        setCurrentText(1);
      }, 500);
      
      const timer2 = setTimeout(() => {
        setCurrentText(2);
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [phase]);

  if (!textVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        {/* Main Headline */}
        <div className="space-y-4">
          {textLines.map((line, index) => (
            <h1
              key={index}
              className={`text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent transition-all duration-1000 ${
                index <= currentText 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-0 transform translate-y-8'
              }`}
              style={{ 
                textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                animationDelay: `${index * 200}ms`
              }}
            >
              {line}
            </h1>
          ))}
        </div>

        {/* Subtitle */}
        <p className={`text-xl md:text-2xl text-blue-100/80 max-w-2xl mx-auto transition-all duration-1000 delay-1000 ${
          phase === 'complete' 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4'
        }`}>
          Comprehensive privacy analysis powered by advanced AI technology
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center mt-8 transition-all duration-1000 delay-1500 pointer-events-auto ${
          phase === 'complete' 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4'
        }`}>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Start Assessment
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};