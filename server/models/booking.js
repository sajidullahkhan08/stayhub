module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      checkIn: DataTypes.DATEONLY,
      checkOut: DataTypes.DATEONLY,
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "rejected"),
        defaultValue: "pending",
      },
      userId: DataTypes.INTEGER,
      roomId: DataTypes.INTEGER,
    },
    {},
  );

  Booking.associate = function (models) {
    Booking.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Booking.belongsTo(models.Room, { foreignKey: "roomId", as: "room" });
  };
  return Booking;
};
