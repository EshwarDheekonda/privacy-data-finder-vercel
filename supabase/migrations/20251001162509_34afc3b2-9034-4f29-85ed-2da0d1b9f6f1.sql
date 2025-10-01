-- Fix function search paths for security
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_otps() CASCADE;

-- Recreate cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_otps
  WHERE expires_at < NOW();
END;
$$;

-- Recreate trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_otps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Clean up expired OTPs on each insert
  PERFORM public.cleanup_expired_otps();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER cleanup_on_insert
  AFTER INSERT ON public.password_reset_otps
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_cleanup_expired_otps();