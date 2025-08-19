-- Create a secure function to check if an email already exists in Supabase Auth
CREATE OR REPLACE FUNCTION public.email_exists(email_input text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = lower(email_input)
  );
$$;