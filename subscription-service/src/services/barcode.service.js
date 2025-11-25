const QRCode = require('qrcode');

/**
 * Generate QR code data string for subscriptions containing all information
 * @param {number} subscriptionId - Subscription ID
 * @param {number} userId - User ID
 * @param {string} planName - Plan name
 * @param {string} endDate - End date (ISO string)
 * @param {string} uniqueCode - Unique code for security
 * @returns {string} QR code data as JSON string
 */
const generateSubscriptionQrCodeData = (subscriptionId, userId, planName, endDate, uniqueCode) => {
    try {
        const qrData = {
            subscriptionId: subscriptionId.toString(),
            userId: userId.toString(),
            planName: planName,
            endDate: endDate,
            uniqueCode: uniqueCode,
            type: 'SUBSCRIPTION',
        };
        return JSON.stringify(qrData);
    } catch (error) {
        console.error('Error generating subscription QR code data:', error);
        return `SUB-${subscriptionId}-${uniqueCode}`;
    }
};

/**
 * Generate QR code image and return as Base64 encoded string
 * @param {string} qrCodeData - Data to encode in QR code
 * @returns {Promise<string>} Base64 encoded PNG image
 */
const generateQrCodeImageBase64 = async (qrCodeData) => {
    try {
        const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
        });
        // Remove the "data:image/png;base64," prefix
        return qrCodeImage.replace(/^data:image\/png;base64,/, '');
    } catch (error) {
        console.error('Error generating QR code image:', error);
        throw error;
    }
};

/**
 * Decode QR code data from JSON string
 * @param {string} qrCodeData - QR code data string
 * @returns {Object} Decoded QR code data
 */
const decodeQrCodeData = (qrCodeData) => {
    try {
        return JSON.parse(qrCodeData);
    } catch (error) {
        console.error('Error decoding QR code data:', error);
        return { rawData: qrCodeData };
    }
};

module.exports = {
    generateSubscriptionQrCodeData,
    generateQrCodeImageBase64,
    decodeQrCodeData,
};
