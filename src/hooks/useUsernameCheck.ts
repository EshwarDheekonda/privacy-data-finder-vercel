import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUsernameCheck = (username: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      setError(null);
      return;
    }

    const checkUsername = async () => {
      setIsChecking(true);
      setError(null);

      try {
        console.log('Checking username:', username);
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        console.log('Username check result:', { data, error, username });

        if (error) {
          console.error('Username check error:', error);
          setError('Failed to check username availability');
          setIsAvailable(null);
        } else {
          const available = !data;
          console.log('Username available:', available);
          setIsAvailable(available);
        }
      } catch (err) {
        console.error('Username check exception:', err);
        setError('Failed to check username availability');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  return { isChecking, isAvailable, error };
};