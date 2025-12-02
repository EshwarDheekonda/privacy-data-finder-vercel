import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export const AuthDialog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, verifyOTP, resetPasswordForEmail, updatePassword, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPasswordResetOTP, setShowPasswordResetOTP] = useState(false);
  const [isInPasswordResetFlow, setIsInPasswordResetFlow] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordResetOtp, setPasswordResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const authMode = searchParams.get('auth');
  const isOpen = authMode === 'signin' || authMode === 'signup' || authMode === 'reset';
  const activeTab = authMode === 'signup' ? 'signup' : 'signin';

  // Handle password reset mode
  useEffect(() => {
    if (authMode === 'reset' && !showPasswordReset) {
      setShowPasswordReset(true);
    }
  }, [authMode]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const currentUsername = signUpForm.watch('username');
  const currentEmail = signUpForm.watch('email');
  const { isChecking: isCheckingUsername, isAvailable } = useUsernameCheck(currentUsername);
  const { isChecking: isCheckingEmail, emailExists } = useEmailCheck(currentEmail);

  // Close dialog and redirect when user is authenticated (but not during password reset flow)
  useEffect(() => {
    if (user && isOpen && !isInPasswordResetFlow) {
      handleClose();
      navigate('/');
    }
  }, [user, isOpen, isInPasswordResetFlow]);

  const handleClose = () => {
    searchParams.delete('auth');
    setSearchParams(searchParams);
    setShowForgotPassword(false);
    setShowOTPVerification(false);
    setShowPasswordReset(false);
    setShowPasswordResetOTP(false);
    setIsInPasswordResetFlow(false);
    setOtp('');
    setPasswordResetOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotPasswordEmail('');
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ auth: value });
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.username, data.fullName);
      
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSignupEmail(data.email);
        setShowOTPVerification(true);
        setOtpTimer(60);
        toast({
          title: 'Verification code sent!',
          description: 'Check your email for the 6-digit verification code.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyOTP(signupEmail, otp, 'signup');
      
      if (error) {
        toast({
          title: 'Verification failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account verified!',
          description: 'Welcome to PrivacyGuard. You can now start assessing privacy risks.',
        });
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
      });
      
      if (error) {
        toast({
          title: 'Failed to resend code',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setOtpTimer(60);
        toast({
          title: 'Code resent!',
          description: 'Check your email for a new verification code.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to resend code',
        description: error.message,
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
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signed in successfully!',
          description: 'Welcome back to PrivacyGuard.',
        });
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPasswordForEmail(forgotPasswordEmail);

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setIsInPasswordResetFlow(true);
        setShowForgotPassword(false);
        setShowPasswordResetOTP(true);
        setOtpTimer(60);
        toast({
          title: 'Verification code sent!',
          description: 'Check your email for a 6-digit verification code.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPasswordResetOTP = async () => {
    if (passwordResetOtp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyOTP(forgotPasswordEmail, passwordResetOtp, 'recovery');
      
      if (error) {
        toast({
          title: 'Verification failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setShowPasswordResetOTP(false);
        setShowPasswordReset(true);
        toast({
          title: 'Verified!',
          description: 'Now you can set your new password.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPasswordResetOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'recovery' as any,
        email: forgotPasswordEmail,
      });
      
      if (error) {
        toast({
          title: 'Failed to resend code',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setOtpTimer(60);
        toast({
          title: 'Code resent!',
          description: 'Check your email for a new verification code.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to resend code',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        toast({
          title: 'Password update failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setIsInPasswordResetFlow(false);
        toast({
          title: 'Password updated!',
          description: 'Your password has been successfully updated.',
        });
        handleClose();
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {showPasswordReset ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Reset Your Password</DialogTitle>
              <DialogDescription>
                Enter your new password below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : showOTPVerification ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Verify Your Email</DialogTitle>
              <DialogDescription>
                We've sent a 6-digit code to {signupEmail}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in {otpTimer}s
                  </p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Resend verification code
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOTPVerification(false);
                    setOtp('');
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back to Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : showPasswordResetOTP ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Verify Your Identity</DialogTitle>
              <DialogDescription>
                We've sent a 6-digit code to {forgotPasswordEmail}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password-reset-otp">Verification Code</Label>
                <Input
                  id="password-reset-otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={passwordResetOtp}
                  onChange={(e) => setPasswordResetOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button
                onClick={handleVerifyPasswordResetOTP}
                disabled={isLoading || passwordResetOtp.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in {otpTimer}s
                  </p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleResendPasswordResetOTP}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Resend verification code
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordResetOTP(false);
                    setPasswordResetOtp('');
                    setShowForgotPassword(true);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back to Email Entry
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : showForgotPassword ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Code
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Welcome to PrivacyGuard</DialogTitle>
              <DialogDescription>
                Sign in to your account or create a new one to get started
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormDescription>
                            {isCheckingUsername ? 'Checking availability...' : 
                             isAvailable === true ? <span className="text-green-500">✓ Available!</span> : 
                             isAvailable === false ? <span className="text-red-500">✗ Taken</span> : 
                             currentUsername.length >= 3 ? 'Checking...' : 'Must be at least 3 characters'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            {isCheckingEmail ? 'Checking...' : emailExists ? <span className="text-red-500">Email already registered</span> : ''}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || emailExists === true || isAvailable === false}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
