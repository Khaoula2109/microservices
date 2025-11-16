const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

let pool;

const connectDB = async () => {
    try {
        if (pool) return pool.request();
        pool = await sql.connect(config);
        console.log('Connecté à SQL Server avec succès.');
        return pool.request();
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err);
        setTimeout(connectDB, 5000);
    }
};

module.exports = { connectDB };