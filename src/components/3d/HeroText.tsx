import { useState, useEffect } from 'react';

interface HeroTextProps {
  phase: 'intro' | 'shield-reveal' | 'text-appear' | 'complete';
}

export const HeroText = ({ phase }: HeroTextProps) => {
  const [textVisible, setTextVisible] = useState(false);
  const [currentText, setCurrentText] = useState(0);

  const textLines = [
    "Discover Your",
    "Digital Footprint",
    "& Privacy Risk"
  ];

  useEffect(() => {
    if (phase === 'text-appear' || phase === 'complete') {
      setTextVisible(true);
      
      // Stagger text appearance
      const timers = textLines.map((_, index) => 
        setTimeout(() => {
          setCurrentText(index + 1);
        }, index * 300)
      );

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      setTextVisible(false);
      setCurrentText(0);
    }
  }, [phase]);

  if (!textVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center px-4 max-w-4xl">
        {textLines.map((line, index) => (
          <div
            key={index}
            className={`
              transition-all duration-700 ease-out
              ${index < currentText 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <h1 
              className={`
                font-bold text-white drop-shadow-2xl
                ${index === 0 ? 'text-3xl md:text-6xl lg:text-7xl' : ''}
                ${index === 1 ? 'text-2xl md:text-5xl lg:text-6xl gradient-text' : ''}
                ${index === 2 ? 'text-xl md:text-4xl lg:text-5xl text-white/90' : ''}
                ${index > 0 ? 'mt-2' : ''}
              `}
            >
              {line}
            </h1>
          </div>
        ))}

        {/* Subtitle appears last */}
        <div
          className={`
            mt-6 transition-all duration-700 ease-out delay-1000
            ${currentText >= 3 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
            }
          `}
        >
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Advanced PII risk assessment tool that analyzes your digital presence 
            and provides actionable privacy insights.
          </p>
        </div>

        {/* Call-to-action appears last */}
        <div
          className={`
            mt-8 transition-all duration-700 ease-out delay-1500
            ${currentText >= 3 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-4 pointer-events-none'
            }
          `}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="glass-button px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105">
              Start Assessment
            </button>
            <button className="text-white/80 hover:text-white transition-colors duration-300 text-lg underline underline-offset-4">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};