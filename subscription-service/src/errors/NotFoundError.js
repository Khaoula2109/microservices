const ApiError = require('./ApiError');

class NotFoundError extends ApiError {
    constructor(message = 'Ressource non trouvée') {
        super(404, message);
    }
}
module.exports = NotFoundError;