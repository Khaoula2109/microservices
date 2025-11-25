-- Add QR code image column to tickets table
-- This column will store the Base64 encoded QR code image

ALTER TABLE tickets
ADD COLUMN qr_code_image LONGTEXT NULL COMMENT 'Base64 encoded QR code image';

-- Note: The qr_code_data column should remain unique
-- ALTER TABLE tickets ADD UNIQUE INDEX idx_qr_code_data (qr_code_data);
