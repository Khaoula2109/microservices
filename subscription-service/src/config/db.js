// Charger .env SEULEMENT si pas en production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'subscriptions_db',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const connectDB = async () => {
  try {
    if (pool) {
      return pool;
    }
    
    console.log('🔄 Connexion à MSSQL...');
    console.log(`   Server: ${config.server}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connecté à MSSQL');
    return pool;
  } catch (err) {
    console.error('❌ Erreur de connexion MSSQL:', err.message);
    throw err;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return pool;
};

module.exports = { 
  config, 
  sql, 
  connectDB,
  getPool
};
