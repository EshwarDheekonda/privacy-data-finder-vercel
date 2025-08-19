import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, Mail, Lock, User, Chrome, CheckCircle, ArrowLeft, Clock, RotateCcw, AlertCircle, Check, Info } from 'lucide-react';
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

  // Username availability check
  const currentUsername = signUpForm.watch('username');
  const { isChecking, isAvailable, error: usernameError } = useUsernameCheck(currentUsername);

  // Email availability check
  const currentEmail = signUpForm.watch('email');
  const { isChecking: isCheckingEmail, emailExists, error: emailError } = useEmailCheck(currentEmail);

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
                            <div className="relative">
                              <Input placeholder="Enter your email" {...field} />
                              {field.value && field.value.includes('@') && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  {isCheckingEmail ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : emailExists === true ? (
                                    <Info className="h-4 w-4 text-blue-500" />
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {field.value && field.value.includes('@') && emailExists === true && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs text-blue-700 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                An account already exists with this email. Continue to sign in instead.
                              </p>
                            </div>
                          )}
                          {emailError && (
                            <p className="text-xs text-destructive">{emailError}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    
                    {/* Only show username field if email doesn't exist */}
                    {!emailExists && (
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
                              <div className="relative">
                                <Input placeholder="Choose a username" {...field} />
                                {field.value && field.value.length >= 3 && (
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    {isChecking ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : isAvailable === true ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : isAvailable === false ? (
                                      <AlertCircle className="h-4 w-4 text-destructive" />
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {field.value && field.value.length > 0 && (
                              <FormDescription className="text-xs text-muted-foreground">
                                Username must be 3+ characters. Only letters, numbers, and underscores allowed.
                              </FormDescription>
                            )}
                            {field.value && field.value.length >= 3 && (
                              <>
                                {isAvailable === false && (
                                  <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-xs text-red-700 flex items-center gap-1 font-medium">
                                      <AlertCircle className="h-3 w-3" />
                                      Username already exists. Try another username.
                                    </p>
                                  </div>
                                )}
                                {isAvailable === true && (
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Username is available!
                                  </p>
                                )}
                                {usernameError && (
                                  <p className="text-xs text-destructive">{usernameError}</p>
                                )}
                              </>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Only show full name field if email doesn't exist */}
                    {!emailExists && (
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
                    )}
                    
                    {/* Only show password field if email doesn't exist */}
                    {!emailExists && (
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
                    )}
                    
                    {emailExists ? (
                      <Button 
                        type="button" 
                        variant="outline"
                        className="w-full" 
                        onClick={() => {
                          // Switch to sign in tab and clear the form
                          const tabsList = document.querySelector('[role="tablist"]');
                          const signInTab = tabsList?.querySelector('[value="signin"]') as HTMLElement;
                          signInTab?.click();
                          signUpForm.reset();
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading || (currentUsername && currentUsername.length >= 3 && isAvailable === false)}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    )}
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