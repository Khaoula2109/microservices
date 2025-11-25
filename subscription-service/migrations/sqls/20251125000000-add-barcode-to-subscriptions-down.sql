-- Remove unique index
DROP INDEX IF EXISTS IX_Subscriptions_QrCodeData ON Subscriptions;

-- Remove QR code columns from Subscriptions table
ALTER TABLE Subscriptions
DROP COLUMN IF EXISTS QrCodeData, QrCodeImage;
