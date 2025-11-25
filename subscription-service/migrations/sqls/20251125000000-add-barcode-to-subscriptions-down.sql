-- Remove QR code columns from Subscriptions table
ALTER TABLE Subscriptions DROP COLUMN QrCodeData;
ALTER TABLE Subscriptions DROP COLUMN QrCodeImage;
