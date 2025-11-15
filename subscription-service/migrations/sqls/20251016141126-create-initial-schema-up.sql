CREATE TABLE Plans (
    PlanID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    StripePriceID NVARCHAR(255) NOT NULL UNIQUE,
    Price DECIMAL(10, 2) NOT NULL,
    DurationInDays INT NOT NULL
);

CREATE TABLE Users (
    UserID BIGINT PRIMARY KEY,
    StripeCustomerID NVARCHAR(255) NOT NULL UNIQUE,
    -- AJOUT DE LA COLONNE EMAIL
    Email NVARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Subscriptions (
    SubscriptionID INT PRIMARY KEY IDENTITY(1,1),
    UserID BIGINT NOT NULL,
    PlanID INT NOT NULL,
    StripeSubscriptionID NVARCHAR(255) NOT NULL UNIQUE,
    Status NVARCHAR(50) NOT NULL,
    CurrentPeriodEnd DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PlanID) REFERENCES Plans(PlanID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

INSERT INTO Plans (Name, StripePriceID, Price, DurationInDays) VALUES
('Abonnement Mensuel', 'price_1SIrWERxfAGItUbxdErqrsBI', 1000.00, 30),
('Abonnement Annuel', 'price_1SIrWjRxfAGItUbxVFplja1P', 10000.00, 365);