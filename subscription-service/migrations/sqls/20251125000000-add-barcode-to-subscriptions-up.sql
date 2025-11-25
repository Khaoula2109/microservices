-- Add QR code columns to Subscriptions table (check if not exists first)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Subscriptions') AND name = 'QrCodeData')
BEGIN
    ALTER TABLE Subscriptions
    ADD QrCodeData NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Subscriptions') AND name = 'QrCodeImage')
BEGIN
    ALTER TABLE Subscriptions
    ADD QrCodeImage NVARCHAR(MAX) NULL;
END

-- Create unique index on QrCodeData for faster lookups (check if not exists first)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'Subscriptions') AND name = 'IX_Subscriptions_QrCodeData')
BEGIN
    CREATE UNIQUE INDEX IX_Subscriptions_QrCodeData
    ON Subscriptions(QrCodeData)
    WHERE QrCodeData IS NOT NULL;
END
