-- Create unique index on QrCodeData for faster lookups
CREATE UNIQUE INDEX IX_Subscriptions_QrCodeData
ON Subscriptions(QrCodeData)
WHERE QrCodeData IS NOT NULL;
