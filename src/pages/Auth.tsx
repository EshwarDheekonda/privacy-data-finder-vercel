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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, Mail, Lock, User, ArrowLeft, Info, Timer } from 'lucide-react';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  
  // OTP states
  const [showSignupOTP, setShowSignupOTP] = useState(false);
  const [showPasswordOTP, setShowPasswordOTP] = useState(false);
  const [signupOTP, setSignupOTP] = useState('');
  const [passwordOTP, setPasswordOTP] = useState('');
  const [signupFormData, setSignupFormData] = useState<SignUpFormData | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', username: '', fullName: '' },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const currentUsername = signUpForm.watch('username');
  const { isChecking, isAvailable } = useUsernameCheck(currentUsername);
  const currentEmail = signUpForm.watch('email');
  const { isChecking: isCheckingEmail, emailExists } = useEmailCheck(currentEmail);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'signin') setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResendOTP(true);
    }
  }, [otpTimer]);

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirectTo') || '/';
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
  }, [user, navigate, searchParams]);

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      if (emailExists === true) {
        toast({ title: 'Account already exists', description: 'Please sign in to your existing account.', variant: 'destructive' });
        setActiveTab('signin');
        signInForm.setValue('email', data.email);
        return;
      }

      const response = await supabase.functions.invoke('send-signup-otp', {
        body: { email: data.email, username: data.username, fullName: data.fullName }
      });

      if (response.error) throw new Error(response.error.message);

      setSignupFormData(data);
      setUserEmail(data.email);
      setShowSignupOTP(true);
      setOtpTimer(60);
      setCanResendOTP(false);
      toast({ title: 'Verification code sent!', description: 'Check your email for the 6-digit code.' });
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOTP = async () => {
    if (!signupFormData || signupOTP.length !== 6) return;
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-signup-otp', {
        body: { ...signupFormData, otp: signupOTP }
      });
      if (response.error) throw new Error(response.error.message);
      toast({ title: 'Account created!', description: 'Signing you in...' });
      await signIn(signupFormData.email, signupFormData.password);
      setShowSignupOTP(false);
      setSignupOTP('');
      setSignupFormData(null);
      signUpForm.reset();
    } catch (error: any) {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignupOTP = async () => {
    if (!signupFormData || !canResendOTP) return;
    setIsLoading(true);
    try {
      await supabase.functions.invoke('send-signup-otp', {
        body: { email: signupFormData.email, username: signupFormData.username, fullName: signupFormData.fullName }
      });
      setOtpTimer(60);
      setCanResendOTP(false);
      toast({ title: 'Code resent!', description: 'Check your email.' });
    } catch (error: any) {
      toast({ title: 'Resend failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
      }
    } catch (error) {
      toast({ title: 'Unexpected error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;
    setIsSendingReset(true);
    try {
      const response = await supabase.functions.invoke('send-password-otp', { body: { email: forgotPasswordEmail } });
      if (response.error) throw new Error(response.error.message);
      setShowPasswordOTP(true);
      setOtpTimer(60);
      setCanResendOTP(false);
      toast({ title: 'Code sent!', description: 'Check your email.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleVerifyPasswordOTP = async () => {
    if (passwordOTP.length !== 6 || !newPassword) return;
    setIsResettingPassword(true);
    try {
      const response = await supabase.functions.invoke('reset-password-with-otp', {
        body: { email: forgotPasswordEmail, otp: passwordOTP, newPassword }
      });
      if (response.error) throw new Error(response.error.message);
      toast({ title: 'Password reset!', description: 'You can now sign in.' });
      setShowForgotPassword(false);
      setShowPasswordOTP(false);
      setPasswordOTP('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsResettingPassword(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <Card className="w-full max-w-md">
          {showSignupOTP ? (
            <>
              <CardHeader>
                <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => { setShowSignupOTP(false); setSignupOTP(''); setActiveTab('signup'); }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <CardTitle>Verify Email</CardTitle>
                <CardDescription>Enter the 6-digit code sent to {userEmail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={signupOTP} onChange={setSignupOTP} disabled={isLoading}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifySignupOTP} disabled={isLoading || signupOTP.length !== 6} className="w-full">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify & Create Account'}
                </Button>
                <div className="text-center text-sm">
                  {otpTimer > 0 ? <div className="flex items-center justify-center gap-2 text-muted-foreground"><Timer className="h-4 w-4" />Resend in {otpTimer}s</div> : 
                  <Button variant="link" className="px-0" onClick={handleResendSignupOTP} disabled={isLoading}>Resend code</Button>}
                </div>
              </CardContent>
            </>
          ) : showForgotPassword && showPasswordOTP ? (
            <>
              <CardHeader>
                <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => { setShowPasswordOTP(false); setPasswordOTP(''); setShowForgotPassword(false); }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter the 6-digit code sent to {forgotPasswordEmail} and your new password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={passwordOTP} onChange={setPasswordOTP} disabled={isResettingPassword}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isResettingPassword}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isResettingPassword}
                />
                {newPassword !== confirmPassword && (
                  <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertDescription>Passwords do not match.</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleVerifyPasswordOTP} disabled={isResettingPassword || passwordOTP.length !== 6 || newPassword !== confirmPassword} className="w-full">
                  {isResettingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</> : 'Reset Password'}
                </Button>
                <div className="text-center text-sm">
                  {otpTimer > 0 ? <div className="flex items-center justify-center gap-2 text-muted-foreground"><Timer className="h-4 w-4" />Resend in {otpTimer}s</div> : 
                  <Button variant="link" className="px-0" onClick={handleForgotPassword} disabled={isSendingReset}>Resend code</Button>}
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>Sign in or create account</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="ml-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signin" className="space-y-4">
                    <Form {...signInForm}>
                      <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                        <FormField
                          control={signInForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="mail@example.com" type="email" {...field} />
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
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button disabled={isLoading} className="w-full" type="submit">
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : <><Lock className="mr-2 h-4 w-4" />Sign In</>}
                        </Button>
                      </form>
                    </Form>
                    <div className="mt-4">
                      <Button variant="link" className="px-0 w-fit" onClick={() => setShowForgotPassword(true)}>Forgot password?</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <FormField
                          control={signUpForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="mail@example.com" type="email" {...field} />
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
                                <Input type="password" placeholder="Password" {...field} />
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
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormDescription>
                                {isChecking ? 'Checking availability...' : 
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
                        <Button disabled={isLoading || isChecking || !isAvailable} className="w-full" type="submit">
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : <><User className="mr-2 h-4 w-4" />Create Account</>}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

