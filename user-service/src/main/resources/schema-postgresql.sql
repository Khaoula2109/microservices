-- Update the role check constraint to include CONTROLLER
-- This script is idempotent and safe to run multiple times

-- Drop the existing constraint if it exists
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- Add the updated constraint with all valid roles
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('PASSENGER', 'ADMIN', 'DRIVER', 'CONTROLLER'));
