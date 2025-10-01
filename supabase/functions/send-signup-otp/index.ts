import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, fullName } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log('Sending signup OTP to:', email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      throw new Error('User with this email already exists');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otpCode);

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('password_reset_otps')
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        purpose: 'signup',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store OTP');
    }

    // Send email using Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { error: emailError } = await resend.emails.send({
      from: 'PrivacyGuard <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Signup Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to PrivacyGuard!</h1>
          <p style="font-size: 16px; color: #666;">Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      throw new Error('Failed to send verification email');
    }

    console.log('OTP sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to your email' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in send-signup-otp:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send verification code' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
