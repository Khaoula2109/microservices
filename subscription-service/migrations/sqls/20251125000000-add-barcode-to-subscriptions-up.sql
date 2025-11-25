-- Add QR code columns to Subscriptions table
ALTER TABLE Subscriptions
ADD QrCodeData NVARCHAR(MAX) NULL,
    QrCodeImage NVARCHAR(MAX) NULL;

-- Create unique index on QrCodeData for faster lookups
CREATE UNIQUE INDEX IX_Subscriptions_QrCodeData
ON Subscriptions(QrCodeData)
WHERE QrCodeData IS NOT NULL;
