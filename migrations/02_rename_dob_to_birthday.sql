-- Rename dob column to birthday in user_profiles table
ALTER TABLE public.user_profiles RENAME COLUMN dob TO birthday;

-- Comment on the column to explain its purpose
COMMENT ON COLUMN public.user_profiles.birthday IS 'User birthday (month and day only, no year) for sending birthday rewards'; 