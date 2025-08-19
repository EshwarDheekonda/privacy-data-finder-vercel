import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, UserCheck, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProtectedResultsProps {
  children: ReactNode;
  searchQuery?: string;
  resultsCount?: number;
}

export const ProtectedResults = ({ children, searchQuery, resultsCount }: ProtectedResultsProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  const handleSignUp = () => {
    const currentPath = location.pathname + location.search;
    navigate(`/auth?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  return (
    <div className="space-y-6">
      {/* Results Found Banner */}
      <Card className="glass-card border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Critical Data Found</CardTitle>
                <CardDescription>
                  We discovered {resultsCount || 'multiple'} sources containing your personal information
                  {searchQuery && ` for "${searchQuery}"`}
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive" className="text-sm">
              {resultsCount || '10+'} Results
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Blocked Results Display */}
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="glass-card max-w-md mx-4 border-primary/30">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Unlock Your Privacy Report</CardTitle>
              <CardDescription>
                Your personal information was found across multiple websites. 
                Create a free account to view the complete analysis and protect your privacy.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Detailed Analysis</div>
                    <div className="text-sm text-muted-foreground">See exactly what data was found</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Risk Assessment</div>
                    <div className="text-sm text-muted-foreground">Understand your exposure level</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Protection Recommendations</div>
                    <div className="text-sm text-muted-foreground">Get actionable privacy tips</div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSignUp}
                className="w-full"
                size="lg"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <button 
                  onClick={handleSignUp}
                  className="text-primary hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};