const AppException = require('./AppException');

class NotFoundException extends AppException {
  constructor(message) {
    super(message, 404);
  }
}

module.exports = NotFoundException;