const express = require('express');
const { createSubscription, stripeWebhook, validateQrCode } = require('../controllers/subscription.controller.js');
const gatewayAuth = require('../middleware/gatewayAuth'); // NOUVEAU
const router = express.Router();

// HEALTH CHECK
router.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'subscription-service' }));

// PROTECTED
router.post('/create-checkout-session', express.json(), gatewayAuth, createSubscription);

// QR CODE VALIDATION (For controllers/admin)
router.get('/validate-qr/:qrCode', express.json(), validateQrCode);

// PUBLIC WEBHOOK
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// PUBLIC
router.get('/success', (req, res) => res.send('Paiement réussi! Votre abonnement est actif.'));
router.get('/cancel', (req, res) => res.send('Paiement annulé.'));

module.exports = router;