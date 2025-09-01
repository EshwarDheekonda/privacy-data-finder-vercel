import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import { supabase } from '@/integrations/supabase/client';
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
import { Loader2, Mail, Lock, User, Chrome, CheckCircle, ArrowLeft, Clock, RotateCcw, AlertCircle, Check, Info, KeyRound, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: z.string().min(1, 'Full name is required'),
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
  // OTP-based password reset states
  const [otpStep, setOtpStep] = useState<'email' | 'otp' | 'password'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('signin'); // Add state for active tab
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

  // Check if this is a password reset flow - multiple ways to detect it
  const isPasswordReset = searchParams.get('reset') === 'true';
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');
  
  // Additional password reset detection methods for better compatibility
  const hasResetTokens = accessToken && refreshToken;
  const isRecoveryType = type === 'recovery';
  const isPasswordResetFlow = isPasswordReset || isRecoveryType || hasResetTokens;

  // Debug logging
  useEffect(() => {
    const allParams = Object.fromEntries(searchParams.entries());
    console.log('Auth page loaded with URL params:', {
      reset: searchParams.get('reset'),
      type: searchParams.get('type'),
      access_token: accessToken ? 'present' : 'missing',
      refresh_token: refreshToken ? 'present' : 'missing',
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      all_params: allParams,
      current_url: window.location.href
    });
  }, [searchParams, accessToken, refreshToken, type]);

  // Handle auth tokens from password reset email
  useEffect(() => {
    const handleAuthTokens = async () => {
      if (type === 'recovery' && accessToken && refreshToken) {
        console.log('Processing recovery tokens...');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session setup error:', error);
            toast({
              title: 'Reset link invalid',
              description: 'The password reset link is invalid or has expired. Please request a new one.',
              variant: 'destructive',
            });
            navigate('/auth');
          } else {
            console.log('Session established for password reset:', data);
            // The session is now established, user can reset password
          }
        } catch (error) {
          console.error('Auth token handling error:', error);
          toast({
            title: 'Reset link error',
            description: 'There was an error processing the reset link. Please try again.',
            variant: 'destructive',
          });
          navigate('/auth');
        }
      } else if (type === 'recovery') {
        console.log('Recovery type detected but missing tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
      }
    };

    handleAuthTokens();
  }, [type, accessToken, refreshToken, navigate, toast]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Timer effect for OTP functionality
  useEffect(() => {
    if (showForgotPassword && otpStep === 'otp' && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showForgotPassword, otpStep, otpTimer]);

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

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'signin') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect if already authenticated (but not during password reset)
  useEffect(() => {
    // Don't redirect if this is a password reset flow
    const isPasswordResetFlow = type === 'recovery' || isPasswordReset || searchParams.get('reset') === 'true';
    
    if (user && !isPasswordResetFlow) {
      const redirectTo = searchParams.get('redirectTo') || '/';
      
      // If redirecting to results page, restore search results from localStorage
      if (redirectTo.includes('/results')) {
        const pendingResults = localStorage.getItem('pendingSearchResults');
        if (pendingResults) {
          localStorage.removeItem('pendingSearchResults');
          navigate(redirectTo, { state: { searchResponse: JSON.parse(pendingResults) } });
          return;
        }
      }
      
      navigate(redirectTo);
    }
  }, [user, navigate, searchParams, type, isPasswordReset]);

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

  // OTP-based password reset functions
  const handleSendOtp = async () => {
    if (!otpEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-otp', {
        body: { email: otpEmail },
      });

      if (error) {
        toast({
          title: 'Failed to send OTP',
          description: error.message || 'Failed to send OTP code. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'OTP sent!',
          description: 'Check your email for the 6-digit verification code.',
        });
        setOtpStep('otp');
        setOtpTimer(600); // Reset timer to 10 minutes
        setCanResendOtp(false);
      }
    } catch (error: any) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    setIsSendingReset(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-otp', {
        body: { email: otpEmail },
      });

      if (error) {
        toast({
          title: 'Failed to resend OTP',
          description: error.message || 'Failed to resend OTP code. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'OTP resent!',
          description: 'Check your email for the new 6-digit verification code.',
        });
        setOtpTimer(600); // Reset timer to 10 minutes
        setCanResendOtp(false);
        setOtpCode(''); // Clear previous code
      }
    } catch (error: any) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      // Just move to password step - verification will happen when setting the password
      setOtpStep('password');
      toast({
        title: 'OTP verified!',
        description: 'Please enter your new password.',
      });
    } catch (error: any) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPasswordWithOtp = async () => {
    if (!otpNewPassword) {
      toast({
        title: 'Password required',
        description: 'Please enter a new password.',
        variant: 'destructive',
      });
      return;
    }

    if (otpNewPassword !== otpConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (otpNewPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
        body: { 
          email: otpEmail,
          otpCode: otpCode,
          newPassword: otpNewPassword 
        },
      });

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message || 'Failed to reset password. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password reset successful!',
          description: 'Your password has been updated. Please sign in with your new password.',
        });
        
        // Reset all states and close modal
        setShowForgotPassword(false);
        setOtpStep('email');
        setOtpEmail('');
        setOtpCode('');
        setOtpNewPassword('');
        setOtpConfirmPassword('');
        
        // Pre-fill the email in sign in form
        signInForm.setValue('email', otpEmail);
        setActiveTab('signin');
      }
    } catch (error: any) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const resetOtpFlow = () => {
    setOtpStep('email');
    setOtpEmail('');
    setOtpCode('');
    setOtpNewPassword('');
    setOtpConfirmPassword('');
    setOtpTimer(600);
    setCanResendOtp(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingReset(true);
    try {
      // First, sign out any existing sessions to ensure fresh tokens
      await supabase.auth.signOut();
      
      // Wait a moment before sending reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a more explicit redirect URL for password reset
      const resetRedirectUrl = `${window.location.origin}/auth?reset=true&type=recovery`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: resetRedirectUrl,
      });

      if (error) {
        toast({
          title: 'Reset failed',
          description: error.message || 'Failed to send password reset email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password reset email sent!',
          description: 'Check your email for the password reset link.',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword) {
      toast({
        title: 'Password required',
        description: 'Please enter a new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message || 'Failed to reset password.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password reset successful!',
          description: 'Your password has been updated. You are now signed in.',
        });
        // Clear URL parameters and redirect to home page
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Unexpected error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    // Clear any pending search results from localStorage
    localStorage.removeItem('pendingSearchResults');
    
    // Navigate back based on context
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      navigate(redirectTo);
    } else {
      navigate('/');
    }
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

  // Show password reset form if we have recovery tokens or explicit reset flag
  if (isPasswordResetFlow) {
    console.log('Showing password reset form:', { type, isPasswordReset, hasResetTokens, isRecoveryType });
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-24 pb-8 max-w-md">
          <Card className="glass-card border-primary/20 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted z-10"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Reset Your Password
              </CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePasswordReset();
                    }
                  }}
                />
              </div>
              
              <Button 
                onClick={handlePasswordReset} 
                disabled={isResettingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (showVerificationBanner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-24 pb-8 max-w-md">
          <Card className="glass-card border-primary/20 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted z-10"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
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
        <Card className="glass-card border-primary/20 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted z-10"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to PrivacyGuard
            </CardTitle>
            <CardDescription>
              Secure your digital identity with advanced PII protection
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setShowForgotPassword(true);
                          resetOtpFlow();
                        }}
                      >
                        Forgot your password?
                      </Button>
                    </div>
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
                            <FormLabel>Full Name</FormLabel>
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
                          setActiveTab('signin');
                          signUpForm.reset();
                          // Pre-fill the email in sign in form
                          signInForm.setValue('email', currentEmail);
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

      {/* OTP-based Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          resetOtpFlow();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {otpStep === 'email' && 'Enter your email address to receive a verification code'}
              {otpStep === 'otp' && 'Enter the 6-digit code sent to your email'}
              {otpStep === 'password' && 'Create your new password'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Step 1: Email Input */}
            {otpStep === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="Enter your email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendOtp();
                      }
                    }}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSendOtp} 
                    disabled={isSendingReset || !otpEmail}
                    className="w-full"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification Code
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForgotPassword(false);
                      resetOtpFlow();
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {otpStep === 'otp' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to
                  </p>
                  <p className="font-medium">{otpEmail}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-center block">Enter Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(value) => setOtpCode(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    {otpTimer > 0 ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Code expires in {formatTime(otpTimer)}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">Code has expired</p>
                    )}

                    {canResendOtp ? (
                      <Button
                        variant="ghost"
                        onClick={handleResendOtp}
                        disabled={isSendingReset}
                        className="text-primary hover:text-primary/80"
                      >
                        {isSendingReset ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Resend Code
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleVerifyOtp} 
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="w-full"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Verify Code
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setOtpStep('email')}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Email
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: New Password */}
            {otpStep === 'password' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Code verified! Set your new password
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-new-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      New Password
                    </Label>
                    <Input
                      id="otp-new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp-confirm-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="otp-confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={otpConfirmPassword}
                      onChange={(e) => setOtpConfirmPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleResetPasswordWithOtp();
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleResetPasswordWithOtp} 
                      disabled={isResettingPassword || !otpNewPassword || !otpConfirmPassword}
                      className="w-full"
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setOtpStep('otp')}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Verification
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}