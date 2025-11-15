const AppException = require('../exceptions/AppException');

const errorHandler = (error, req, res, next) => {
  console.error('Erreur:', error);

  if (error instanceof AppException) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      timestamp: error.timestamp,
      code: error.statusCode
    });
  }

  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(err => err.message);
    return res.status(400).json({
      success: false,
      error: 'Données de validation invalides',
      details: messages,
      timestamp: new Date().toISOString(),
      code: 400
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Une ressource avec ces données existe déjà',
      timestamp: new Date().toISOString(),
      code: 409
    });
  }

  // Erreur de clé étrangère Sequelize
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Référence à une ressource inexistante',
      timestamp: new Date().toISOString(),
      code: 400
    });
  }

  // Erreur générale
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    timestamp: new Date().toISOString(),
    code: 500
  });
};

module.exports = errorHandler;