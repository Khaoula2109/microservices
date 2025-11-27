-- Add loyalty_points column to app_users table
-- This migration adds support for the loyalty program

-- Add the column with a default value of 0
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- Update any existing users to have 0 loyalty points if they somehow don't have a value
UPDATE app_users SET loyalty_points = 0 WHERE loyalty_points IS NULL;
