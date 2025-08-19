import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Mail, Lock, User, Chrome, CheckCircle, ArrowLeft, Clock, RotateCcw } from 'lucide-react';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userSignupData, setUserSignupData] = useState<SignUpFormData | null>(null);
  const [resendTimer, setResendTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      fullName: '',
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Timer effect for resend functionality
  useEffect(() => {
    if (showVerificationBanner && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showVerificationBanner, resendTimer]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirectTo') || '/';
      navigate(redirectTo);
    }
  }, [user, navigate, searchParams]);

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.username, data.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account already exists',
            description: 'Please sign in to your existing account or use a different email.',
            variant: 'destructive',
          });
        } else if (error.message.includes('username')) {
          toast({
            title: 'Username unavailable',
            description: 'This username is already taken. Please choose a different one.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign up failed',
            description: error.message || 'An error occurred during sign up.',
            variant: 'destructive',
          });
        }
        } else {
          setUserEmail(data.email);
          setUserSignupData(data);
          setShowVerificationBanner(true);
          setResendTimer(300); // Reset timer to 5 minutes
          setCanResend(false);
          signUpForm.reset();
        }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid credentials',
            description: 'Please check your email and password and try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign in failed',
            description: error.message || 'An error occurred during sign in.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!userSignupData || !canResend) return;
    
    setIsResending(true);
    try {
      const { error } = await signUp(
        userSignupData.email, 
        userSignupData.password, 
        userSignupData.username, 
        userSignupData.fullName
      );
      
      if (error) {
        toast({
          title: 'Resend failed',
          description: error.message || 'Failed to resend verification email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification email sent!',
          description: 'Please check your email for the verification link.',
        });
        setResendTimer(300); // Reset timer to 5 minutes
        setCanResend(false);
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: 'Google sign in failed',
          description: error.message || 'An error occurred during Google sign in.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showVerificationBanner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-24 pb-8 max-w-md">
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-primary">Check Your Email</h2>
                  <p className="text-muted-foreground">
                    We've sent a verification email to
                  </p>
                  <p className="font-medium">{userEmail}</p>
                </div>
                
                <Alert className="border-primary/20 bg-primary/5">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Please check your email and click the verification link to activate your account. 
                    Don't forget to check your spam folder if you don't see it in your inbox.
                  </AlertDescription>
                </Alert>
                
                <div className="pt-4 space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVerificationBanner(false)}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email?
                    </p>
                    
                    {canResend ? (
                      <Button
                        variant="ghost"
                        onClick={handleResendEmail}
                        disabled={isResending}
                        className="text-primary hover:text-primary/80"
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Resend Email
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Resend available in {formatTime(resendTimer)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-md">{/* Added pt-24 for header space */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to PrivacyGuard
            </CardTitle>
            <CardDescription>
              Secure your digital identity with advanced PII protection
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="signup">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signUpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6">
              <Separator className="mb-4" />
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}