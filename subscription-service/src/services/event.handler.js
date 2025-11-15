const { connectDB } = require('../config/db');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const getOrCreateStripeCustomer = async (userId, email) => {
    const db = await connectDB();
    const userResult = await db.query(`SELECT UserID, StripeCustomerID FROM Users WHERE UserID = '${userId}'`);

    if (userResult.recordset.length > 0 && userResult.recordset[0].StripeCustomerID) {
        console.log(`Utilisateur ${userId} existe déjà avec Stripe ID: ${userResult.recordset[0].StripeCustomerID}`);
        return userResult.recordset[0].StripeCustomerID;
    }

    const customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId },
    });
    console.log(`✅ Client Stripe créé pour ${email} avec ID: ${customer.id}`);

    if (userResult.recordset.length > 0) {
        await db.query(`UPDATE Users SET StripeCustomerID = '${customer.id}', Email = '${email}' WHERE UserID = '${userId}'`);
        console.log(`Utilisateur ${userId} mis à jour avec le nouveau StripeCustomerID.`);
    } else {
        await db.query(`INSERT INTO Users (UserID, StripeCustomerID, Email) VALUES ('${userId}', '${customer.id}', '${email}')`);
        console.log(`Utilisateur ${userId} inséré avec le nouveau StripeCustomerID.`);
    }

    return customer.id;
};

const handleUserRegistered = async (eventData) => {
    const { userId, email } = eventData;

    if (!userId || !email) {
        console.error('❌ [EventHandler] Données invalides pour user.registered: userId ou email manquants.', eventData);
        return;
    }

    try {
        console.log(`[EventHandler] Création/Récupération du client Stripe pour l'utilisateur ${userId} (${email})...`);
        await getOrCreateStripeCustomer(userId, email);
        console.log(`✅ [EventHandler] Client Stripe traité pour l'utilisateur ${userId}.`);
    } catch (error) {
        console.error(`❌ [EventHandler] Échec de la création/récupération du client Stripe pour ${userId}:`, error.message);
        throw error;
    }
};

module.exports = {
    handleUserRegistered,
    getOrCreateStripeCustomer,
};