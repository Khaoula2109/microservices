const ApiError = require('../errors/ApiError');

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Une erreur interne est survenue sur le serveur.';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        console.error(err);
    }

    const errorResponse = {
        statusCode: statusCode,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;