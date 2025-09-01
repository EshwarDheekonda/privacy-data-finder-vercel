import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSignupOTPRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const resend = new Resend(resendApiKey);

  try {
    const { email }: SendSignupOTPRequest = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if email already exists
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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in table with purpose 'signup_verification'
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({ email, otp_code: otpCode, purpose: 'signup_verification' });

    if (insertError) {
      console.error('Insert OTP error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send OTP via email
    try {
      await resend.emails.send({
        from: "PrivacyGuard <noreply@resend.dev>",
        to: [email],
        subject: "Your PrivacyGuard sign-up code",
        html: `
          <div style="font-family: Arial, sans-serif; color: #111;">
            <h2>Verify your email</h2>
            <p>Use the verification code below to complete your sign up to PrivacyGuard.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${otpCode}</div>
            <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('Resend send error:', mailError);
      // Still return success to avoid leaking user existence
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error('send-signup-otp error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});