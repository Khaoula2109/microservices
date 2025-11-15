const { connectDB } = require('../config/db');
const { publishEvent } = require('../config/rabbit');
const { getOrCreateStripeCustomer } = require('./event.handler');
const {
    SUBSCRIPTION_CREATED,
    SUBSCRIPTION_RENEWED,
    SUBSCRIPTION_PAYMENT_FAILED,
    SUBSCRIPTION_CANCELED,
} = require('../constants/rabbitmqConstants');
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
            console.error('Stripe Invalid Request:', error.message);
            throw new BadRequestError('Requête invalide auprès du service de paiement.');
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

            await db.query(`
          INSERT INTO Subscriptions (UserID, PlanID, StripeSubscriptionID, Status, CurrentPeriodEnd)
          VALUES ('${userId}', ${planId}, '${subscription.id}', '${subscription.status}', '${new Date(subscription.current_period_end * 1000).toISOString()}')
      `);
            console.log(`✅ Abonnement ${subscription.id} activé pour l'utilisateur ${userId}.`);

            if (publishEventCallback) {
                publishEventCallback(SUBSCRIPTION_CREATED, {
                    userId: userId.toString(),
                    userEmail: userEmail,
                    planName: planName,
                    amount: subscription.items.data[0].price.unit_amount / 100,
                    currency: subscription.items.data[0].price.currency,
                    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
                    status: subscription.status,
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

module.exports = {
    getOrCreateStripeCustomer,
    createCheckoutSession,
    handleSubscriptionWebhook,
};