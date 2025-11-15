const asyncHandler = require('../middleware/asyncHandler');
const BadRequestError = require('../errors/BadRequestError');
const { createCheckoutSession, handleSubscriptionWebhook } = require('../services/subscription.service');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const { publishEvent } = require('../config/rabbit');

const createSubscription = asyncHandler(async (req, res, next) => {
    const { userId, email, priceId } = req.body;

    if (!userId || !email || !priceId) {
        return next(new BadRequestError('userId, email et priceId sont requis.'));
    }

    const session = await createCheckoutSession(userId, email, priceId);
    res.json({ url: session.url });
});

const stripeWebhook = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Erreur de signature du webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    handleSubscriptionWebhook(event, publishEvent)
        .catch(error => {
            console.error('Erreur lors du traitement du webhook Stripe:', error);

            res.status(500).send('Erreur interne du serveur lors du traitement du webhook.');
        });

    res.json({ received: true });
};

module.exports = { createSubscription, stripeWebhook };