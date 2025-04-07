-- Create user_profiles table for storing user profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  dob DATE,
  avatar_url TEXT,
  theme VARCHAR DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profiles' );

CREATE POLICY "Users can upload their own profile picture."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "Users can update their own profile picture."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text ); 