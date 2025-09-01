-- Fix linter: ensure search_path is set for security definer functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.password_reset_otps 
  WHERE expires_at < now() OR is_used = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  PERFORM public.cleanup_expired_otps();
  RETURN NEW;
END;
$function$;