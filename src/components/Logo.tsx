import { cn } from '@/lib/utils';
import logoMain from '@/assets/logo-main.png';
import logoWhite from '@/assets/logo-white.png';
import logoDark from '@/assets/logo-dark.png';

interface LogoProps {
  variant?: 'main' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'main', 
  size = 'md', 
  animated = false, 
  className = '',
  showText = false 
}) => {
  const logoSrc = {
    main: logoMain,
    white: logoWhite,
    dark: logoDark
  }[variant];

  const logoComponent = (
    <img 
      src={logoSrc} 
      alt="PrivacyShield Logo" 
      className={cn(
        sizeClasses[size],
        'transition-all duration-300',
        animated && 'hover:scale-110 hover:rotate-3',
        className
      )}
    />
  );

  if (!showText) {
    return logoComponent;
  }

  return (
    <div className="flex items-center gap-3">
      {logoComponent}
      <div className="flex flex-col">
        <span className={cn(
          "font-bold leading-none",
          size === 'sm' && "text-lg",
          size === 'md' && "text-xl", 
          size === 'lg' && "text-2xl",
          size === 'xl' && "text-3xl",
          variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-foreground' : 'gradient-text'
        )}>
          PrivacyShield
        </span>
        <span className={cn(
          "text-xs font-medium opacity-80",
          variant === 'white' ? 'text-white/80' : 'text-muted-foreground'
        )}>
          Risk Assessment
        </span>
      </div>
    </div>
  );
};