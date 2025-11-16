if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const amqp = require('amqplib');

// Utiliser RABBITMQ_URL si disponible, sinon construire depuis les composants
const getRabbitMQUrl = () => {
  if (process.env.RABBITMQ_URL) {
    return process.env.RABBITMQ_URL;
  }
  
  if (process.env.RABBITMQ_URI) {
    return process.env.RABBITMQ_URI;
  }
  
  const host = process.env.RABBITMQ_HOST || 'localhost';
  const port = process.env.RABBITMQ_PORT || '5672';
  const user = process.env.RABBITMQ_USER || 'user';
  const password = process.env.RABBITMQ_PASSWORD || 'password';
  
  return `amqp://${user}:${password}@${host}:${port}`;
};

const rabbitmqUrl = getRabbitMQUrl();

module.exports = { amqp, rabbitmqUrl };
