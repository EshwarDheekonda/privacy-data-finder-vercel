import { useState, useEffect } from 'react';
import { Menu, X, Shield, Search, Settings, User, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  onGetStartedClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGetStartedClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Use Cases', href: '#use-cases' }
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out.',
      });
      navigate('/');
    }
  };

  const handleAuthClick = () => {
    setSearchParams({ auth: 'signin' });
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled 
        ? 'glass-card backdrop-blur-xl border-b border-glass-border shadow-elevated' 
        : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          {/* Logo */}
          <div className={`flex items-center flex-shrink-0 z-10 ${user ? 'max-w-[200px] lg:max-w-none' : ''}`}>
            <Logo 
              variant="white" 
              size={user ? "sm" : "md"}
              animated 
              showText 
              className="cursor-pointer"
            />
          </div>

          {/* Desktop Navigation - Hide on smaller screens when user is signed in to prevent overlap */}
          <nav className={`hidden items-center ${user ? 'lg:flex space-x-4 xl:space-x-6' : 'md:flex space-x-6 lg:space-x-8'} flex-1 justify-center min-w-0 max-w-xl mx-2 lg:mx-4`}>
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white/80 hover:text-white transition-colors duration-200 font-medium text-xs lg:text-sm whitespace-nowrap"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                  title="Search"
                  onClick={onGetStartedClick}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <div className="hidden lg:flex items-center gap-2 text-white/80 text-sm max-w-[200px] truncate">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <FeedbackDialog
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <MessageSquare className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Feedback</span>
                    </Button>
                  }
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                >
                  <LogOut className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAuthClick}
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  size="sm"
                  onClick={onGetStartedClick}
                  className="bg-primary hover:bg-primary/90 glow-primary transition-colors"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-card mt-2 p-4 rounded-lg border border-glass-border">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white/80 hover:text-white transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-white/80 text-sm p-2">
                      <User className="h-4 w-4" />
                      {user.email}
                    </div>
                    <FeedbackDialog
                      trigger={
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 justify-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Feedback
                        </Button>
                      }
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 justify-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleAuthClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 justify-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        onGetStartedClick?.();
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-primary hover:bg-primary/90 glow-primary justify-center transition-colors"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};