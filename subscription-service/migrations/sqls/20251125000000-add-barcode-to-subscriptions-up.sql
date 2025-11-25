-- Add QR code columns to Subscriptions table
ALTER TABLE Subscriptions ADD QrCodeData NVARCHAR(MAX) NULL;
ALTER TABLE Subscriptions ADD QrCodeImage NVARCHAR(MAX) NULL;
