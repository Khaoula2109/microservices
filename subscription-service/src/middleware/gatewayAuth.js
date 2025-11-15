const asyncHandler = require('./asyncHandler');

const gatewayAuth = asyncHandler(async (req, res, next) => {
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
        return res.status(401).json({
            success: false,
            error: 'Non authentifié - Requête doit passer par la Gateway'
        });
    }

    req.userEmail = userEmail;

    console.log(`✅ Utilisateur authentifié via Gateway: ${userEmail}`);
    next();
});

module.exports = gatewayAuth;