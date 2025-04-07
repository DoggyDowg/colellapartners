-- Seed data script for Colella Partners referral system
-- This script adds test data to demonstrate the admin dashboard functionality

-- 1. Add more referral partners with different created_at dates for time-based filtering
INSERT INTO referrers (id, full_name, email, phone, created_at, is_business, partner_code, business_name, active)
VALUES 
    ('d5f4c3b2-a1b2-c3d4-e5f6-a7b8c9d0e1f2', 'Jane Smith', 'jane.smith@example.com', '555-123-4567', NOW() - INTERVAL '15 days', false, 'JSMITH', NULL, true),
    ('c4d3b2a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3', 'Robert Johnson', 'robert@example.com', '555-234-5678', NOW() - INTERVAL '45 days', false, 'RJOHN', NULL, true),
    ('b3c2a1d0-c3d4-e5f6-a7b8-c9d0e1f2a3b4', 'Mary Williams', 'mary@example.com', '555-345-6789', NOW() - INTERVAL '3 months', false, 'MWILL', NULL, true),
    ('a2b1c0d9-d4e5-f6a7-b8c9-d0e1f2a3b4c5', 'James Brown', 'james@example.com', '555-456-7890', NOW() - INTERVAL '6 months', false, 'JBROW', NULL, true),
    ('90a1b2c3-e5f6-a7b8-c9d0-e1f2a3b4c5d6', 'Boston Realty Group', 'contact@bostonrealty.com', '555-567-8901', NOW() - INTERVAL '9 months', true, 'BRG', 'Boston Realty Group', true),
    ('80b2c3d4-f6a7-b8c9-d0e1-f2a3b4c5d6e7', 'Hometown Mortgage', 'partners@hometownmtg.com', '555-678-9012', NOW() - INTERVAL '12 months', true, 'HTM', 'Hometown Mortgage', true);

-- 2. Add referrals with different statuses and dates
-- New referrals (last 7 days)
INSERT INTO referrals (id, referrer_id, referee_name, referee_phone, referee_email, situation_description, contact_consent, created_at, referee_type, status, status_updated_at)
VALUES
    ('11c22d33-e44f-55a6-b77c-88d99e00f11f', 'd5f4c3b2-a1b2-c3d4-e5f6-a7b8c9d0e1f2', 'Alex Johnson', '555-111-2222', 'alex@example.com', 'Looking to sell home in Boston area', true, NOW() - INTERVAL '2 days', 'seller', 'new', NOW() - INTERVAL '2 days'),
    ('22d33e44-f55a-66b7-c88d-99e00f11f22f', 'c4d3b2a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3', 'Sarah Miller', '555-222-3333', 'sarah@example.com', 'First-time homebuyer', true, NOW() - INTERVAL '3 days', 'buyer', 'new', NOW() - INTERVAL '3 days'),
    ('33e44f55-a66b-77c8-8d99-e00f11f22f33', 'b3c2a1d0-c3d4-e5f6-a7b8-c9d0e1f2a3b4', 'David Wilson', '555-333-4444', 'david@example.com', 'Looking for investment property', true, NOW() - INTERVAL '5 days', 'buyer', 'new', NOW() - INTERVAL '5 days');

-- Contacted referrals (last 30 days)
INSERT INTO referrals (id, referrer_id, referee_name, referee_phone, referee_email, situation_description, contact_consent, created_at, referee_type, status, status_updated_at)
VALUES
    ('44f55a66-b77c-88d9-9e00-f11f22f33e44', 'a2b1c0d9-d4e5-f6a7-b8c9-d0e1f2a3b4c5', 'Emily Davis', '555-444-5555', 'emily@example.com', 'Relocating to Boston for work', true, NOW() - INTERVAL '15 days', 'buyer', 'contacted', NOW() - INTERVAL '10 days'),
    ('55a66b77-c88d-99e0-0f11-f22f33e44f55', '90a1b2c3-e5f6-a7b8-c9d0-e1f2a3b4c5d6', 'Michael Brown', '555-555-6666', 'michael@example.com', 'Downsizing from current home', true, NOW() - INTERVAL '20 days', 'seller', 'contacted', NOW() - INTERVAL '15 days');

-- In progress referrals (last 90 days)
INSERT INTO referrals (id, referrer_id, referee_name, referee_phone, referee_email, situation_description, contact_consent, created_at, referee_type, status, status_updated_at, assigned_agent)
VALUES
    ('66b77c88-d99e-00f1-1f22-f33e44f55a66', '80b2c3d4-f6a7-b8c9-d0e1-f2a3b4c5d6e7', 'Jennifer Smith', '555-666-7777', 'jennifer@example.com', 'Looking for larger home for growing family', true, NOW() - INTERVAL '40 days', 'buyer', 'in_progress', NOW() - INTERVAL '30 days', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42'),
    ('77c88d99-e00f-11f2-2f33-e44f55a66b77', 'd5f4c3b2-a1b2-c3d4-e5f6-a7b8c9d0e1f2', 'Thomas Anderson', '555-777-8888', 'thomas@example.com', 'Selling home to move to retirement community', true, NOW() - INTERVAL '60 days', 'seller', 'in_progress', NOW() - INTERVAL '45 days', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42');

-- Completed referrals (various time periods)
INSERT INTO referrals (id, referrer_id, referee_name, referee_phone, referee_email, situation_description, contact_consent, created_at, referee_type, status, status_updated_at, assigned_agent, sale_date, property_address)
VALUES
    ('88d99e00-f11f-22f3-3e44-f55a66b77c88', 'c4d3b2a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3', 'Elizabeth Wilson', '555-888-9999', 'elizabeth@example.com', 'First-time homebuyer', true, NOW() - INTERVAL '3 months', 'buyer', 'completed', NOW() - INTERVAL '1 month', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42', NOW() - INTERVAL '1 month', '123 Main St, Boston, MA'),
    ('99e00f11-f22f-33e4-4f55-a66b77c88d99', 'b3c2a1d0-c3d4-e5f6-a7b8-c9d0e1f2a3b4', 'Robert Garcia', '555-999-0000', 'robert.g@example.com', 'Selling investment property', true, NOW() - INTERVAL '6 months', 'seller', 'completed', NOW() - INTERVAL '4 months', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42', NOW() - INTERVAL '4 months', '456 Oak Ave, Cambridge, MA'),
    ('00f11f22-f33e-44f5-5a66-b77c88d99e00', 'a2b1c0d9-d4e5-f6a7-b8c9-d0e1f2a3b4c5', 'Patricia Martinez', '555-000-1111', 'patricia@example.com', 'Buying vacation home', true, NOW() - INTERVAL '9 months', 'buyer', 'completed', NOW() - INTERVAL '7 months', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42', NOW() - INTERVAL '7 months', '789 Pine Rd, Brookline, MA'),
    ('f11f22f3-3e44-f55a-66b7-7c88d99e00f1', '90a1b2c3-e5f6-a7b8-c9d0-e1f2a3b4c5d6', 'Kevin Thompson', '555-111-2222', 'kevin@example.com', 'Relocating for new job', true, NOW() - INTERVAL '12 months', 'buyer', 'completed', NOW() - INTERVAL '10 months', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42', NOW() - INTERVAL '10 months', '321 Elm St, Somerville, MA');

-- 3. Add rewards with different statuses and dates
-- Pending rewards
INSERT INTO rewards (id, referral_id, referrer_id, amount, status, reward_type, created_at)
VALUES
    ('aaa11bbb-22cc-33dd-44ee-55ff66aa77bb', '88d99e00-f11f-22f3-3e44-f55a66b77c88', 'c4d3b2a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3', 500.00, 'pending', 'cash', NOW() - INTERVAL '25 days'),
    ('bbb22ccc-33dd-44ee-55ff-66aa77bb88cc', '99e00f11-f22f-33e4-4f55-a66b77c88d99', 'b3c2a1d0-c3d4-e5f6-a7b8-c9d0e1f2a3b4', 750.00, 'pending', 'cash', NOW() - INTERVAL '3 months');

-- Paid rewards
INSERT INTO rewards (id, referral_id, referrer_id, amount, status, reward_type, created_at, payment_date)
VALUES
    ('ccc33ddd-44ee-55ff-66aa-77bb88cc99dd', '00f11f22-f33e-44f5-5a66-b77c88d99e00', 'a2b1c0d9-d4e5-f6a7-b8c9-d0e1f2a3b4c5', 500.00, 'paid', 'cash', NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months'),
    ('ddd44eee-55ff-66aa-77bb-88cc99ddee11', 'f11f22f3-3e44-f55a-66b7-7c88d99e00f1', '90a1b2c3-e5f6-a7b8-c9d0-e1f2a3b4c5d6', 1000.00, 'paid', 'cash', NOW() - INTERVAL '9 months', NOW() - INTERVAL '8 months');

-- 4. Update some existing referrals to ensure we have diverse statuses
UPDATE referrals
SET status = 'completed',
    status_updated_at = NOW() - INTERVAL '2 days',
    sale_date = NOW() - INTERVAL '3 days',
    property_address = '555 Washington St, Boston, MA'
WHERE id = '7a6628f2-55e8-4ca0-9d73-85fdd1a34971';

-- 5. Add a reward for the updated referral
INSERT INTO rewards (id, referral_id, referrer_id, amount, status, reward_type, created_at)
VALUES 
    ('eee55fff-66aa-77bb-88cc-99ddee11ff22', '7a6628f2-55e8-4ca0-9d73-85fdd1a34971', '60fc3eee-9be5-42a8-9ba4-f2e72468bd42', 650.00, 'pending', 'cash', NOW() - INTERVAL '1 day'); 