-- Add QR code columns to Subscriptions table
-- Using TRY/CATCH to handle if columns already exist
BEGIN TRY
    ALTER TABLE Subscriptions ADD QrCodeData NVARCHAR(MAX) NULL;
END TRY
BEGIN CATCH
    -- Column already exists, ignore error
    PRINT 'QrCodeData column already exists';
END CATCH;

BEGIN TRY
    ALTER TABLE Subscriptions ADD QrCodeImage NVARCHAR(MAX) NULL;
END TRY
BEGIN CATCH
    -- Column already exists, ignore error
    PRINT 'QrCodeImage column already exists';
END CATCH;

-- Create unique index on QrCodeData for faster lookups
BEGIN TRY
    CREATE UNIQUE INDEX IX_Subscriptions_QrCodeData
    ON Subscriptions(QrCodeData)
    WHERE QrCodeData IS NOT NULL;
END TRY
BEGIN CATCH
    -- Index already exists, ignore error
    PRINT 'IX_Subscriptions_QrCodeData index already exists';
END CATCH;
