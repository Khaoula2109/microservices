-- Add QR code columns to Subscriptions table
-- QrCodeData: NVARCHAR(1000) for indexing (JSON data is relatively small)
-- QrCodeImage: NVARCHAR(MAX) for base64 image (no index needed)
ALTER TABLE Subscriptions ADD QrCodeData NVARCHAR(1000) NULL;
ALTER TABLE Subscriptions ADD QrCodeImage NVARCHAR(MAX) NULL;
