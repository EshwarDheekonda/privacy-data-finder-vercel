import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifySignupOTPRequest {
  email: string;
  otpCode: string;
  password: string;
  username: string;
  fullName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { email, otpCode, password, username, fullName }: VerifySignupOTPRequest = await req.json();

    if (!email || !otpCode || !password || !username || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check OTP validity
    const { data: otpRow, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .eq('is_used', false)
      .eq('purpose', 'signup_verification')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError) {
      console.error('OTP lookup error:', otpError);
      return new Response(JSON.stringify({ error: 'Failed to validate code' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!otpRow) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Mark OTP as used
    const { error: markError } = await supabase
      .from('password_reset_otps')
      .update({ is_used: true })
      .eq('id', otpRow.id);

    if (markError) {
      console.error('Mark OTP used error:', markError);
    }

    // Ensure email not already registered
    const { data: existsData, error: existsError } = await supabase.rpc('email_exists', {
      email_input: email,
    });
    if (existsError) {
      console.error('email_exists RPC error:', existsError);
      return new Response(JSON.stringify({ error: 'Failed to check email' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (existsData === true) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create the user and confirm email immediately
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    });

    if (createError || !created?.user) {
      console.error('Create user error:', createError);
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: created.user.id, username, full_name: fullName });

    if (profileError) {
      console.error('Insert profile error:', profileError);
      // Do not fail the whole flow if profile insert fails
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error('verify-signup-otp error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});