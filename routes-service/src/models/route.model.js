module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define('Route', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    startPoint: {
      type: DataTypes.STRING,
      field: 'start_point'
    },
    endPoint: {
      type: DataTypes.STRING,
      field: 'end_point'
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: false,
    tableName: 'routes'
  });

  return Route;
};