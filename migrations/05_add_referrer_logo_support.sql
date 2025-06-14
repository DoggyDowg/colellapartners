-- Migration: Add logo support for referrers
-- Description: Adds logo_url column to referrers table and creates partner-logos storage bucket

-- 1. Add logo_url column to referrers table
ALTER TABLE referrers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Add comment to the column
COMMENT ON COLUMN referrers.logo_url IS 'URL reference to partner logo stored in Supabase Storage';

-- 3. Create partner-logos storage bucket
-- Note: This part needs to be done through Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('partner-logos', 'partner-logos', true);

-- 4. Set up RLS policies for the partner-logos bucket (if created via SQL)
-- These policies would need to be applied after bucket creation:

-- Allow authenticated users to upload logos
-- CREATE POLICY "Authenticated users can upload partner logos" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'partner-logos' AND auth.role() = 'authenticated');

-- Allow public read access to logos
-- CREATE POLICY "Public read access for partner logos" ON storage.objects
-- FOR SELECT USING (bucket_id = 'partner-logos');

-- Allow users to update their own logos
-- CREATE POLICY "Users can update their own partner logos" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'partner-logos' AND auth.role() = 'authenticated');

-- Allow users to delete their own logos
-- CREATE POLICY "Users can delete their own partner logos" ON storage.objects
-- FOR DELETE USING (bucket_id = 'partner-logos' AND auth.role() = 'authenticated');

-- 5. Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_referrers_logo_url ON referrers(logo_url) WHERE logo_url IS NOT NULL; 