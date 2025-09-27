-- Add sessions column to Groupe table for storing multiple sessions per week
-- Run this in your Supabase SQL editor

-- Add sessions column to store JSON data of multiple sessions
ALTER TABLE public."Groupe" 
ADD COLUMN IF NOT EXISTS sessions jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public."Groupe".sessions IS 'JSON array of sessions with day_of_week and time for each session';

-- Example of what the sessions JSON should look like:
-- [
--   {"day_of_week": "Monday", "time": "09:00:00"},
--   {"day_of_week": "Wednesday", "time": "14:30:00"},
--   {"day_of_week": "Friday", "time": "10:00:00"}
-- ]

-- Optional: Add a check constraint to ensure sessions is a valid JSON array
-- ALTER TABLE public."Groupe" 
-- ADD CONSTRAINT IF NOT EXISTS check_sessions_format 
-- CHECK (sessions IS NULL OR jsonb_typeof(sessions) = 'array');

-- Optional: Update existing groups with sample session data
-- UPDATE public."Groupe" 
-- SET sessions = '[{"day_of_week": "Monday", "time": "09:00:00"}]'::jsonb
-- WHERE sessions IS NULL;
