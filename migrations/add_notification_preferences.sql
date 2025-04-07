-- Add notification preferences columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS communication_emails BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT TRUE;

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_notification_prefs 
ON user_profiles (communication_emails, marketing_emails);

-- Comment on columns to provide documentation
COMMENT ON COLUMN user_profiles.communication_emails IS 'User preference for receiving communication emails about account activity';
COMMENT ON COLUMN user_profiles.marketing_emails IS 'User preference for receiving marketing emails about new products and features';

-- Update existing records to set preferences to TRUE if they are NULL
UPDATE user_profiles
SET 
  communication_emails = TRUE 
WHERE communication_emails IS NULL;

UPDATE user_profiles
SET 
  marketing_emails = TRUE 
WHERE marketing_emails IS NULL; 