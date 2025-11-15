const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

const db = {};

db.Route = require('./route.model.js')(sequelize, DataTypes);
db.Stop = require('./stop.model.js')(sequelize, DataTypes);
db.RouteStop = require('./routeStop.model.js')(sequelize, DataTypes);
db.Schedule = require('./schedule.model.js')(sequelize, DataTypes);

db.Route.belongsToMany(db.Stop, {
  through: db.RouteStop, 
  foreignKey: 'routeId',
  otherKey: 'stopId'
});

db.Stop.belongsToMany(db.Route, { 
  through: db.RouteStop, 
  foreignKey: 'stopId',
  otherKey: 'routeId'
});

db.RouteStop.hasMany(db.Schedule, { 
  foreignKey: 'routeStopId',
  onDelete: 'CASCADE'
});

db.Schedule.belongsTo(db.RouteStop, { 
  foreignKey: 'routeStopId'
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.initializeDatabase = async () => {
  try {
    // Test de connexion à la base de données
    await sequelize.authenticate();
    console.log(' Connexion à la base de données établie avec succès.');


    await sequelize.sync({ force: false, alter: true });
    console.log('Tables synchronisées avec succès.');

    return true;
  } catch (error) {
    console.error(' Erreur lors de la synchronisation de la base de données:', error);
    return false;
  }
};

module.exports = db;