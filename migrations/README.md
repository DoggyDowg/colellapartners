# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

These migrations can be applied directly in the Supabase dashboard:

1. Log in to the [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Go to the "SQL Editor" tab
4. Create a new query
5. Paste the contents of the migration file (e.g., `01_create_user_profiles.sql`)
6. Click "Run" to execute the SQL

## Migration Files

- `01_create_user_profiles.sql`: Creates the user_profiles table and associated RLS policies, as well as a storage bucket for profile pictures
- `02_update_user_profiles.sql`: Updates existing user_profiles table to add a name field and remove bio and urls fields

## Important Notes

- Make sure to run the migrations in order
- After creating the profiles storage bucket, you may need to set up CORS policies in the Supabase dashboard under Storage > Buckets > profiles > Settings
- These migrations include Row Level Security (RLS) policies for data protection, ensure they work with your application's authentication flow 