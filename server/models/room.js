module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      type: DataTypes.STRING,
      price: DataTypes.DECIMAL,
      capacity: DataTypes.INTEGER,
      hotelId: DataTypes.INTEGER,
    },
    {},
  );

  Room.associate = function (models) {
    Room.belongsTo(models.Hotel, { foreignKey: "hotelId", as: "hotel" });
    Room.hasMany(models.Booking, { foreignKey: "roomId", as: "bookings" });
  };
  return Room;
};
