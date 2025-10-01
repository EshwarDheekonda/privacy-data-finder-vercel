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
    const { email, otp, password, username, fullName } = await req.json();

    if (!email || !otp || !password) {
      throw new Error('Email, OTP, and password are required');
    }

    console.log('Verifying OTP for:', email);

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
      .eq('purpose', 'signup')
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

    // Create user account
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      throw new Error(userError.message || 'Failed to create account');
    }

    console.log('User created successfully:', userData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        user: userData.user 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in verify-signup-otp:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to verify code' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
