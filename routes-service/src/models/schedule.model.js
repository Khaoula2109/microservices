module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    routeStopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'route_stop_id',
      references: {
        model: 'route_stops',
        key: 'id'
      }
    },
    arrivalTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'arrival_time'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: 0,
        max: 6
      }
    }
  }, {
    timestamps: false,
    tableName: 'schedules'
  });

  return Schedule;
};