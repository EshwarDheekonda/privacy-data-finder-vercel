import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Search, Shield, Zap, Eye, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { searchApi, handleApiError, SearchResponse, SearchApiError } from '@/lib/api';
import { useCounter } from '@/contexts/CounterContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ParticleSystem } from '@/components/ParticleSystem';
import { Hero3D } from '@/components/Hero3D';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-privacy.jpg';

export interface HeroSectionRef {
  focusSearchInput: () => void;
}

export const HeroSection = forwardRef<HeroSectionRef>((props, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showMainContent, setShowMainContent] = useState(false);
  const [skip3D, setSkip3D] = useState(false);
  const { count, incrementCounter } = useCounter();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fallback: Show main content if 3D doesn't load within 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!showMainContent) {
        console.log('3D animation timeout - showing main content');
        setSkip3D(true);
        setShowMainContent(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [showMainContent]);

  // Check for mobile devices and skip 3D
  useEffect(() => {
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile device detected - skipping 3D');
      setSkip3D(true);
      setShowMainContent(true);
    }

    // Listen for forced main content display from error boundary
    const handleForceShowMain = () => {
      console.log('Received force-show-main-content event');
      setSkip3D(true);
      setShowMainContent(true);
    };

    window.addEventListener('force-show-main-content', handleForceShowMain);
    return () => window.removeEventListener('force-show-main-content', handleForceShowMain);
  }, []);

  const focusSearchInput = () => {
    console.log('focusSearchInput called'); // Debug log
    
    // Skip 3D animation if not already shown
    if (!showMainContent) {
      setSkip3D(true);
      setShowMainContent(true);
    }
    
    // First scroll to the assessment section
    const assessmentElement = document.getElementById('assessment');
    if (assessmentElement) {
      assessmentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Direct focus without delay if main content is shown
    const focusDelay = showMainContent ? 100 : 600;
    setTimeout(() => {
      console.log('Attempting to focus input:', searchInputRef.current); // Debug log
      if (searchInputRef.current) {
        try {
          searchInputRef.current.focus();
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('Input focused successfully'); // Debug log
        } catch (error) {
          console.error('Error focusing input:', error);
        }
      }
    }, focusDelay);
  };

  useImperativeHandle(ref, () => ({
    focusSearchInput
  }));

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setLoadingMessage('Initializing privacy scan...');
    
    try {
      toast({
        title: 'Starting Assessment',
        description: `Scanning privacy risks for "${searchQuery}"...`,
      });

      // Update loading messages to keep user informed
      setTimeout(() => setLoadingMessage('Searching public databases...'), 5000);
      setTimeout(() => setLoadingMessage('Analyzing social media presence...'), 15000);
      setTimeout(() => setLoadingMessage('Checking data broker sites...'), 30000);
      setTimeout(() => setLoadingMessage('Compiling risk assessment...'), 60000);
      setTimeout(() => setLoadingMessage('Finalizing results...'), 120000);

      const response: SearchResponse = await searchApi.searchByName(searchQuery);
      
      // Increment counter on successful assessment
      incrementCounter();
      
      // Success toast
      toast({
        title: 'Assessment Complete',
        description: `Found ${response.total_results} potential privacy risks in ${response.scan_time}s`,
      });

      // Navigate to results page with the response data
      navigate('/results', { 
        state: { searchResponse: response }
      });
      
    } catch (error: any) {
      console.error('Search error caught:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Enhanced Background with Parallax */}
      <div className="absolute inset-0 opacity-15">
        <img 
          src={heroImage} 
          alt="Privacy Protection" 
          className="w-full h-full object-cover scale-110 animate-pulse-glow"
        />
        <div className="absolute inset-0 bg-gradient-depth"></div>
      </div>

      {/* Particle System */}
      <ParticleSystem 
        className="opacity-60" 
        particleCount={80}
        colors={[
          'rgba(138, 113, 255, 0.4)',
          'rgba(72, 187, 120, 0.3)', 
          'rgba(56, 178, 172, 0.3)',
          'rgba(96, 165, 250, 0.2)'
        ]}
      />
      
      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-depth-float absolute top-20 left-20 w-16 h-16 bg-gradient-primary rounded-full opacity-40 blur-sm glow-primary"></div>
        <div className="animate-depth-float absolute top-40 right-32 w-12 h-12 bg-gradient-secondary rounded-full opacity-50 blur-sm glow-secondary" style={{ animationDelay: '2s' }}></div>
        <div className="animate-depth-float absolute bottom-32 left-1/4 w-20 h-20 bg-info/30 rounded-full opacity-35 blur-sm" style={{ animationDelay: '4s' }}></div>
        <div className="animate-depth-float absolute bottom-20 right-20 w-14 h-14 bg-warning/30 rounded-full opacity-45 blur-sm" style={{ animationDelay: '1s' }}></div>
        <div className="animate-depth-float absolute top-1/3 left-10 w-8 h-8 bg-danger/25 rounded-full opacity-30 blur-sm" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* 3D Hero Animation - Reduced z-index to avoid blocking UI */}
      {!showMainContent && !skip3D && (
        <div className="absolute inset-0 z-5 pointer-events-none">
          <Hero3D onAnimationComplete={() => setShowMainContent(true)} />
        </div>
      )}

      {/* Main Content - Higher z-index to stay above 3D elements */}
      <div className={`relative z-20 max-w-6xl mx-auto px-6 text-center transition-all duration-1000 ${showMainContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className={`${showMainContent ? 'animate-slide-up' : ''}`}>
          {/* Enhanced Badge */}
          <div className="inline-flex items-center gap-2 depth-card px-6 py-3 mb-8 text-sm font-medium interactive-glow">
            <Shield className="w-5 h-5 text-secondary animate-pulse-glow" />
            <span className="text-foreground">Enterprise-Grade Privacy Assessment</span>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          </div>

          {/* Enhanced Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="gradient-text animate-shimmer bg-gradient-to-r from-primary via-primary-light to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
              Discover Your
            </span><br />
            <span className="text-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Digital Footprint
            </span><br />
            <span className="text-secondary animate-fade-in" style={{ animationDelay: '0.4s' }}>
              & Privacy Risk
            </span>
          </h1>

          {/* Enhanced Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Advanced PII scanning and risk assessment powered by AI to protect your digital identity. 
            Discover what personal information is exposed online and get actionable privacy recommendations 
            from our enterprise-grade security platform.
          </p>

          {/* Premium Search Bar - Enhanced with refined polish */}
          <div id="assessment" className="max-w-3xl mx-auto mb-8 animate-scale-in relative z-30 group" style={{ animationDelay: '0.8s' }}>
            <div className="vibrant-search-container p-3 pointer-events-auto relative overflow-hidden">
              {/* Enhanced background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
              
              <div className="relative">
                {/* Enhanced search icon with premium micro-animation */}
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-purple-300 w-6 h-6 pointer-events-none transition-all duration-300 ease-out group-hover:text-purple-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-focus-within:text-purple-100 group-focus-within:scale-110 group-focus-within:drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))' }} />
                
                {/* Premium input with enhanced focus states */}
                <Input
                  ref={searchInputRef}
                  placeholder="✨ Enter a full name to discover hidden privacy risks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="vibrant-search-input pl-14 text-lg h-16 rounded-lg cursor-text relative z-10 text-white font-medium placeholder:text-violet-200/80 placeholder:font-normal placeholder:italic transition-all duration-300 ease-out focus:shadow-lg focus:shadow-purple-500/25 focus:scale-[1.02] focus:placeholder:text-violet-100/95 focus:text-white focus:font-semibold hover:placeholder:text-violet-100/90"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={(e) => {
                    console.log('Input focused');
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.transition = 'all 300ms ease-out';
                    e.target.style.textShadow = '0 0 10px rgba(168, 85, 247, 0.4)';
                  }}
                  onBlur={(e) => {
                    console.log('Input blurred');
                    e.target.style.transform = 'scale(1)';
                    e.target.style.textShadow = 'none';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Input clicked - event:', e);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  autoComplete="off"
                  style={{ pointerEvents: 'all' }}
                  aria-label="Enter full name for privacy risk assessment"
                  role="searchbox"
                  aria-describedby="search-description"
                />
                
                {/* Subtle typing indicator glow */}
                {searchQuery && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-pulse pointer-events-none"></div>
                )}
              </div>
            </div>
            
            {/* Subtle bottom glow enhancement */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
            
            {/* Visible search description */}
            <div id="search-description" className="mt-3 text-sm text-violet-200/70 max-w-2xl mx-auto leading-relaxed">
              Our AI scans public databases, social media, and data broker sites to reveal your digital privacy risks
            </div>
          </div>

          {/* Separate Start Assessment Button */}
          <div className="max-w-lg mx-auto mb-12 animate-scale-in relative z-30" style={{ animationDelay: '1s' }}>
            <Button 
              onClick={handleSearch}
              variant="bright-white"
              className="w-full h-16 px-10 text-lg font-bold rounded-lg transition-all duration-500 ease-out transform active:scale-95 group/button relative overflow-hidden"
              disabled={!searchQuery.trim() || isLoading}
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
              aria-label={isLoading ? 'Scanning in progress' : 'Start privacy risk assessment'}
              role="button"
              type="button"
            >
              {/* Button text glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover/button:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
              
              {isLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <Loader className="w-6 h-6 mr-3 animate-spin text-black drop-shadow-lg" />
                  <span className="animate-pulse font-semibold text-black" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
                    Scanning...
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  <Zap className="w-6 h-6 mr-3 text-black transition-all duration-300 group-hover/button:animate-bounce group-hover/button:text-gray-800" />
                  <span className="group-hover/button:tracking-wide transition-all duration-300 font-bold text-black" 
                        style={{ 
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}>
                    ⚡ Start Assessment
                  </span>
                </div>
              )}
            </Button>
          </div>

          {/* Enhanced Loading Status */}
          {isLoading && loadingMessage && (
            <div className="mt-6 p-6 depth-card max-w-lg mx-auto animate-pulse-glow">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="relative">
                  <Loader className="w-6 h-6 animate-spin text-secondary" />
                  <div className="absolute inset-0 w-6 h-6 border-2 border-secondary/20 rounded-full animate-ping"></div>
                </div>
                <span className="text-foreground font-medium">{loadingMessage}</span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2 mb-2">
                <div className="bg-gradient-primary h-2 rounded-full animate-shimmer bg-[length:200%_auto]" style={{ width: '60%' }}></div>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Comprehensive scanning may take up to 3 minutes for thorough analysis
              </div>
            </div>
          )}

          {/* Enhanced Quick Stats */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full">
              <Eye className="w-4 h-4 text-info animate-pulse" />
              <span>Real-time scanning</span>
            </div>
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
            <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full">
              <Shield className="w-4 h-4 text-success animate-pulse" />
              <span>Zero data retention</span>
            </div>
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
            <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full">
              <AnimatedCounter 
                value={count} 
                className="font-bold text-foreground gradient-text text-lg" 
              />
              <span>assessments completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';