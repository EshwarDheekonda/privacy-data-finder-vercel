import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEmailCheck = (email: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      setEmailExists(null);
      setIsChecking(false);
      setError(null);
      return;
    }

    const checkEmail = async () => {
      setIsChecking(true);
      setError(null);

      try {
        // Use the database function to check if email exists
        const { data, error } = await supabase.rpc('email_exists', {
          email_input: email
        });

        if (error) {
          console.error('Email check error:', error);
          setError('Failed to check email availability');
          setEmailExists(null);
        } else {
          setEmailExists(data);
        }
      } catch (err) {
        console.error('Email check exception:', err);
        setError('Failed to check email availability');
        setEmailExists(null);
      } finally {
        setIsChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkEmail, 800);
    return () => clearTimeout(debounceTimer);
  }, [email]);

  return { isChecking, emailExists, error };
};