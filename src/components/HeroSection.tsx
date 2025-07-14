import { useState } from 'react';
import { Search, Shield, Zap, Eye, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { searchApi, handleApiError, SearchResponse, SearchApiError } from '@/lib/api';
import { useCounter } from '@/contexts/CounterContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-privacy.jpg';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { count, incrementCounter } = useCounter();
  const navigate = useNavigate();

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
    <section className="relative min-h-screen flex items-center justify-center particles-bg overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src={heroImage} 
          alt="Privacy Protection" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-float absolute top-20 left-20 w-16 h-16 bg-gradient-primary rounded-full opacity-30 blur-sm"></div>
        <div className="animate-float absolute top-40 right-32 w-12 h-12 bg-gradient-secondary rounded-full opacity-40 blur-sm" style={{ animationDelay: '2s' }}></div>
        <div className="animate-float absolute bottom-32 left-1/4 w-20 h-20 bg-primary/20 rounded-full opacity-25 blur-sm" style={{ animationDelay: '4s' }}></div>
        <div className="animate-float absolute bottom-20 right-20 w-14 h-14 bg-secondary/30 rounded-full opacity-35 blur-sm" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm font-medium">
            <Shield className="w-4 h-4 text-secondary" />
            <span className="text-muted-foreground">Enterprise-Grade Privacy Assessment</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Discover Your</span><br />
            <span className="text-foreground">Digital Footprint</span><br />
            <span className="text-secondary">& Privacy Risk</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Advanced PII scanning and risk assessment to protect your digital identity. 
            Discover what personal information is exposed online and get actionable privacy recommendations.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="glass-card p-2 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Enter a name to assess privacy risk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-transparent border-none text-lg h-14 focus:ring-0"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
               <Button 
                onClick={handleSearch}
                className="bg-gradient-primary hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold"
                disabled={!searchQuery.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Scanning...' : 'Start Assessment'}
              </Button>
            </div>
          </div>

          {/* Loading Status */}
          {isLoading && loadingMessage && (
            <div className="mt-4 p-4 glass-card max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3">
                <Loader className="w-4 h-4 animate-spin text-secondary" />
                <span className="text-muted-foreground text-sm">{loadingMessage}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                This may take up to 3 minutes for comprehensive scanning
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-secondary" />
              <span>Real-time scanning</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No data stored</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="flex items-center gap-2">
              <AnimatedCounter 
                value={count} 
                className="font-semibold text-foreground gradient-text" 
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
};