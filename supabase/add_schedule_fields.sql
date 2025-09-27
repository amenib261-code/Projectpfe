-- Add schedule fields to Groupe table
-- Run this in your Supabase SQL editor

-- Add day_of_week column
ALTER TABLE public."Groupe" 
ADD COLUMN IF NOT EXISTS day_of_week varchar(20);

-- Add time column
ALTER TABLE public."Groupe" 
ADD COLUMN IF NOT EXISTS time time;

-- Add constraints for day_of_week
ALTER TABLE public."Groupe" 
ADD CONSTRAINT IF NOT EXISTS check_day_of_week 
CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- Add comments for documentation
COMMENT ON COLUMN public."Groupe".day_of_week IS 'Day of the week when the group meets';
COMMENT ON COLUMN public."Groupe".time IS 'Time when the group meets';

-- Update RLS policies to include new fields
-- The existing policies should already cover these fields since they're part of the Groupe table

-- Example: Update existing groups with sample schedule data (optional)
-- UPDATE public."Groupe" 
-- SET day_of_week = 'Monday', time = '09:00:00' 
-- WHERE day_of_week IS NULL;

-- Example: Update existing groups with different schedules (optional)
-- UPDATE public."Groupe" 
-- SET day_of_week = 'Tuesday', time = '14:00:00' 
-- WHERE id = 2;

-- Example: Update existing groups with different schedules (optional)
-- UPDATE public."Groupe" 
-- SET day_of_week = 'Wednesday', time = '10:30:00' 
-- WHERE id = 3;
