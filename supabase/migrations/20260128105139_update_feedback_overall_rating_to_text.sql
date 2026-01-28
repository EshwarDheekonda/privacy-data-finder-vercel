-- Update user_feedback table: Change overall_rating from INTEGER to TEXT
-- This allows storing text responses instead of numeric star ratings

-- First, drop the existing CHECK constraint if it exists
ALTER TABLE public.user_feedback 
DROP CONSTRAINT IF EXISTS user_feedback_overall_rating_check;

-- Convert existing integer values to text (cast to text)
-- For existing records, convert numeric ratings to text representation
UPDATE public.user_feedback 
SET overall_rating = overall_rating::TEXT 
WHERE overall_rating IS NOT NULL;

-- Alter the column type from INTEGER to TEXT
ALTER TABLE public.user_feedback 
ALTER COLUMN overall_rating TYPE TEXT USING overall_rating::TEXT;

-- Add a new CHECK constraint to ensure the field is not empty (since it's required)
ALTER TABLE public.user_feedback 
ADD CONSTRAINT user_feedback_overall_rating_not_empty 
CHECK (overall_rating IS NOT NULL AND LENGTH(TRIM(overall_rating)) > 0);
