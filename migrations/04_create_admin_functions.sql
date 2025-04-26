-- Create users table with a role column if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'partner', 'agent', 'user'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own record
CREATE POLICY "Users can view their own user record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to select all user records
CREATE POLICY "Admins can view all user records"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow admins to update all user records
CREATE POLICY "Admins can update all user records"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _is_admin BOOLEAN;
BEGIN
  -- Check if the user exists in the users table with role='admin'
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO _is_admin;
  
  RETURN _is_admin;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO anon;

-- Create trigger function to set admin role based on metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into public.users with role based on metadata
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.raw_user_meta_data->>'is_admin' = 'true' THEN 'admin'
      ELSE 'user'
    END,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to set role in public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert existing users into the public.users table if they don't exist yet
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  CASE
    WHEN raw_user_meta_data->>'is_admin' = 'true' THEN 'admin'
    ELSE 'user'
  END as role,
  created_at,
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING; 