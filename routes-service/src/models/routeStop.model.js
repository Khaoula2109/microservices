module.exports = (sequelize, DataTypes) => {
  const RouteStop = sequelize.define('RouteStop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'route_id',
      references: {
        model: 'routes',
        key: 'id'
      }
    },
    stopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'stop_id',
      references: {
        model: 'stops',
        key: 'id'
      }
    },
    stopOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'stop_order'
    }
  }, {
    timestamps: false,
    tableName: 'route_stops',
    indexes: [
      {
        unique: true,
        fields: ['route_id', 'stop_id']
      },
      {
        unique: true,
        fields: ['route_id', 'stop_order']
      }
    ]
  });

  return RouteStop;
};