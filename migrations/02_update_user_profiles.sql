-- Update existing user_profiles table structure
-- Add name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN name VARCHAR;
        
        -- Update existing records with name from auth.users.raw_user_meta_data
        UPDATE public.user_profiles
        SET name = auth.users.raw_user_meta_data->>'name'
        FROM auth.users
        WHERE public.user_profiles.id = auth.users.id;
        
        -- Set default value for any NULL names
        UPDATE public.user_profiles
        SET name = 'User'
        WHERE name IS NULL;
        
        -- Make name column NOT NULL
        ALTER TABLE public.user_profiles ALTER COLUMN name SET NOT NULL;
    END IF;
END
$$;

-- Remove bio column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.user_profiles DROP COLUMN bio;
    END IF;
END
$$;

-- Remove urls column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'urls'
    ) THEN
        ALTER TABLE public.user_profiles DROP COLUMN urls;
    END IF;
END
$$; 