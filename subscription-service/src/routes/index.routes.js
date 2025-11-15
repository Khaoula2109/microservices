const express = require('express');
const { createSubscription, stripeWebhook } = require('../controllers/subscription.controller.js');
const gatewayAuth = require('../middleware/gatewayAuth'); // NOUVEAU
const router = express.Router();

// PROTECTED
router.post('/create-checkout-session', express.json(), gatewayAuth, createSubscription);

// PUBLIC WEBHOOK
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// PUBLIC
router.get('/success', (req, res) => res.send('Paiement réussi! Votre abonnement est actif.'));
router.get('/cancel', (req, res) => res.send('Paiement annulé.'));

module.exports = router;