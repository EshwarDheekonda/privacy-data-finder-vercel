import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      throw new Error('Email, OTP, and new password are required');
    }

    console.log('Verifying password reset OTP for:', email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp)
      .eq('purpose', 'password_reset')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      console.error('OTP verification failed:', otpError);
      throw new Error('Invalid or expired verification code');
    }

    console.log('OTP verified successfully');

    // Mark OTP as used
    await supabase
      .from('password_reset_otps')
      .update({ is_used: true })
      .eq('id', otpData.id);

    // Get user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      throw new Error('Failed to reset password');
    }

    console.log('Password reset successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in reset-password-with-otp:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to reset password' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
