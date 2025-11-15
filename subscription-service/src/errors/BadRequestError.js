const ApiError = require('./ApiError');

class BadRequestError extends ApiError {
    constructor(message = 'Mauvaise requête') {
        super(400, message);
    }
}
module.exports = BadRequestError;