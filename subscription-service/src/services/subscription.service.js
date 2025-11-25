const { connectDB } = require('../config/db');
const { publishEvent } = require('../config/rabbit');
const { getOrCreateStripeCustomer } = require('./event.handler');
const {
    SUBSCRIPTION_CREATED,
    SUBSCRIPTION_RENEWED,
    SUBSCRIPTION_PAYMENT_FAILED,
    SUBSCRIPTION_CANCELED,
} = require('../constants/rabbitmqConstants');
const {
    generateSubscriptionQrCodeData,
    generateQrCodeImageBase64
} = require('./barcode.service');
const crypto = require('crypto');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ApiError = require('../errors/ApiError');

const createCheckoutSession = async (userId, email, priceId) => {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });
        return session;
    } catch (error) {
        if (error.type === 'StripeCardError') {
            throw new BadRequestError(`Erreur de carte de paiement : ${error.message}`);
        }
        if (error.type === 'StripeInvalidRequestError') {
            console.error('Stripe Invalid Request:', error.message, 'priceId:', priceId, 'customerId:', customerId);
            throw new BadRequestError(`Requête invalide: ${error.message}`);
        }
        throw new ApiError('Une erreur est survenue lors de la création de la session de paiement.');
    }
};

const getSubscriptionDetails = async (db, subscriptionId) => {
    const subResult = await db.query(`
    SELECT S.UserID, U.Email, P.Name AS PlanName
    FROM Subscriptions S
    JOIN Users U ON S.UserID = U.UserID
    JOIN Plans P ON S.PlanID = P.PlanID
    WHERE S.StripeSubscriptionID = '${subscriptionId}'
  `);

    if (subResult.recordset.length > 0) {
        return subResult.recordset[0];
    }
    return null;
};

const handleSubscriptionWebhook = async (stripeEvent, publishEventCallback) => {
    const db = await connectDB();
    const eventObject = stripeEvent.data.object;

    switch (stripeEvent.type) {
        case 'checkout.session.completed': {
            const session = eventObject;
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const customerId = session.customer;

            const userResult = await db.query(`SELECT UserID, Email FROM Users WHERE StripeCustomerID = '${customerId}'`);
            if (userResult.recordset.length === 0) {
                throw new NotFoundError(`Utilisateur non trouvé pour le client Stripe ID: ${customerId}`);
            }
            const { UserID: userId, Email: userEmail } = userResult.recordset[0];

            const priceId = subscription.items.data[0].price.id;
            const planResult = await db.query(`SELECT PlanID, Name FROM Plans WHERE StripePriceID = '${priceId}'`);
            if (planResult.recordset.length === 0) {
                throw new NotFoundError(`Plan non trouvé pour le Stripe Price ID: ${priceId}`);
            }
            const { PlanID: planId, Name: planName } = planResult.recordset[0];

            // Insert subscription first to get the ID
            const insertResult = await db.query(`
          INSERT INTO Subscriptions (UserID, PlanID, StripeSubscriptionID, Status, CurrentPeriodEnd)
          OUTPUT INSERTED.SubscriptionID
          VALUES ('${userId}', ${planId}, '${subscription.id}', '${subscription.status}', '${new Date(subscription.current_period_end * 1000).toISOString()}')
      `);
            const subscriptionId = insertResult.recordset[0].SubscriptionID;

            // Generate QR code
            const uniqueCode = crypto.randomUUID();
            const endDate = new Date(subscription.current_period_end * 1000).toISOString();
            const qrCodeData = generateSubscriptionQrCodeData(subscriptionId, userId, planName, endDate, uniqueCode);

            let qrCodeImage = null;
            try {
                qrCodeImage = await generateQrCodeImageBase64(qrCodeData);
            } catch (error) {
                console.error('Error generating QR code image:', error);
            }

            // Update subscription with QR code data
            await db.query(`
          UPDATE Subscriptions
          SET QrCodeData = '${qrCodeData.replace(/'/g, "''")}', QrCodeImage = ${qrCodeImage ? `'${qrCodeImage.replace(/'/g, "''")}'` : 'NULL'}
          WHERE SubscriptionID = ${subscriptionId}
      `);

            console.log(`✅ Abonnement ${subscription.id} activé pour l'utilisateur ${userId}.`);

            if (publishEventCallback) {
                publishEventCallback(SUBSCRIPTION_CREATED, {
                    userId: userId.toString(),
                    userEmail: userEmail,
                    subscriptionId: subscriptionId.toString(),
                    planName: planName,
                    amount: subscription.items.data[0].price.unit_amount / 100,
                    currency: subscription.items.data[0].price.currency,
                    endDate: endDate,
                    status: subscription.status,
                    qrCodeData: qrCodeData,
                    qrCodeImage: qrCodeImage,
                });
            }
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = eventObject;
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

            await db.query(`
          UPDATE Subscriptions
          SET Status = '${subscription.status}', CurrentPeriodEnd = '${new Date(subscription.current_period_end * 1000).toISOString()}'
          WHERE StripeSubscriptionID = '${subscription.id}'
      `);
            console.log(`✅ Renouvellement réussi pour l'abonnement ${subscription.id}.`);

            const details = await getSubscriptionDetails(db, subscription.id);
            if (details && publishEventCallback) {
                publishEventCallback(SUBSCRIPTION_RENEWED, {
                    userId: details.UserID.toString(),
                    userEmail: details.Email,
                    planName: details.PlanName,
                    amount: invoice.amount_paid / 100,
                    currency: invoice.currency,
                    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
                    status: subscription.status,
                });
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = eventObject;
            const subscriptionId = invoice.subscription;
            await db.query(`
          UPDATE Subscriptions
          SET Status = 'past_due'
          WHERE StripeSubscriptionID = '${subscriptionId}'
      `);
            console.log(`❌ Paiement échoué pour l'abonnement ${subscriptionId}.`);

            const details = await getSubscriptionDetails(db, subscriptionId);
            if (details && publishEventCallback) {
                publishEventCallback(SUBSCRIPTION_PAYMENT_FAILED, {
                    userId: details.UserID.toString(),
                    userEmail: details.Email,
                    planName: details.PlanName,
                    status: 'past_due',
                    lastPaymentError: invoice.last_payment_error?.message || 'Échec de paiement inconnu',
                });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = eventObject;
            await db.query(`
          UPDATE Subscriptions
          SET Status = '${subscription.status}' 
          WHERE StripeSubscriptionID = '${subscription.id}'
      `);
            console.log(`🚫 Abonnement ${subscription.id} annulé.`);

            const details = await getSubscriptionDetails(db, subscription.id);
            if (details && publishEventCallback) {
                publishEventCallback(SUBSCRIPTION_CANCELED, {
                    userId: details.UserID.toString(),
                    userEmail: details.Email,
                    planName: details.PlanName,
                    status: subscription.status,
                });
            }
            break;
        }

        default:
            console.log(`Événement webhook Stripe non géré : ${stripeEvent.type}`);
    }
};

const validateSubscriptionByQrCode = async (qrCode) => {
    const db = await connectDB();

    try {
        // First try to find subscription by QR code data directly
        let result = await db.query(`
            SELECT S.SubscriptionID, S.UserID, S.Status, S.CurrentPeriodEnd, S.QrCodeImage,
                   P.Name AS PlanName, U.Email, U.FirstName, U.LastName
            FROM Subscriptions S
            JOIN Plans P ON S.PlanID = P.PlanID
            JOIN Users U ON S.UserID = U.UserID
            WHERE S.QrCodeData = '${qrCode.replace(/'/g, "''")}'
        `);

        // If not found, try to decode JSON and find by subscription ID
        if (result.recordset.length === 0) {
            try {
                const { decodeQrCodeData } = require('./barcode.service');
                const qrData = decodeQrCodeData(qrCode);
                if (qrData.subscriptionId) {
                    result = await db.query(`
                        SELECT S.SubscriptionID, S.UserID, S.Status, S.CurrentPeriodEnd, S.QrCodeImage,
                               P.Name AS PlanName, U.Email, U.FirstName, U.LastName
                        FROM Subscriptions S
                        JOIN Plans P ON S.PlanID = P.PlanID
                        JOIN Users U ON S.UserID = U.UserID
                        WHERE S.SubscriptionID = ${qrData.subscriptionId}
                    `);
                }
            } catch (error) {
                console.error('Error decoding QR code:', error);
            }
        }

        if (result.recordset.length === 0) {
            return {
                valid: false,
                message: 'QR Code invalide - Abonnement non trouvé'
            };
        }

        const subscription = result.recordset[0];
        const now = new Date();
        const endDate = new Date(subscription.CurrentPeriodEnd);
        const isExpired = now > endDate;

        // Check if subscription is active
        if (subscription.Status !== 'active' && subscription.Status !== 'trialing') {
            return {
                valid: false,
                message: 'Abonnement non actif',
                subscriptionId: subscription.SubscriptionID,
                userId: subscription.UserID,
                planName: subscription.PlanName,
                status: subscription.Status,
                endDate: subscription.CurrentPeriodEnd,
                ownerName: `${subscription.FirstName} ${subscription.LastName}`,
                ownerEmail: subscription.Email,
                qrCodeImage: subscription.QrCodeImage
            };
        }

        // Check if subscription is expired
        if (isExpired) {
            return {
                valid: false,
                message: 'Abonnement expiré',
                subscriptionId: subscription.SubscriptionID,
                userId: subscription.UserID,
                planName: subscription.PlanName,
                status: subscription.Status,
                endDate: subscription.CurrentPeriodEnd,
                ownerName: `${subscription.FirstName} ${subscription.LastName}`,
                ownerEmail: subscription.Email,
                qrCodeImage: subscription.QrCodeImage
            };
        }

        // Subscription is valid
        return {
            valid: true,
            message: 'Abonnement valide - Bon voyage!',
            subscriptionId: subscription.SubscriptionID,
            userId: subscription.UserID,
            planName: subscription.PlanName,
            status: subscription.Status,
            endDate: subscription.CurrentPeriodEnd,
            ownerName: `${subscription.FirstName} ${subscription.LastName}`,
            ownerEmail: subscription.Email,
            qrCodeImage: subscription.QrCodeImage
        };
    } catch (error) {
        console.error('Error validating subscription by QR code:', error);
        throw new ApiError('Erreur lors de la validation de l\'abonnement');
    }
};

module.exports = {
    getOrCreateStripeCustomer,
    createCheckoutSession,
    handleSubscriptionWebhook,
    validateSubscriptionByQrCode,
};